import {
  Download,
  Maximize2,
  Minimize2,
  Play,
  Save,
  Settings,
  Upload,
  Code2,
  FileText,
  Zap,
  Palette,
  Type,
  Monitor,
  Eye,
} from "lucide-react";
import { editor } from "monaco-editor";
import dynamic from "next/dynamic";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { diff_match_patch } from "diff-match-patch";
import EditorSettingsPopup from "./settings";
import { Button } from "@/components/ui/button";
import { mono } from "@/app/fonts";
import { EDITOR_THEME_NAME, editorTheme } from "./theme";

// Dynamically import Monaco Editor (SSR disabled)
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-term-bg">
      <p className="label text-ink-subtle">Loading editor</p>
    </div>
  ),
});

/** Idle window before a run of keystrokes is diffed and sent. */
const DIFF_DEBOUNCE_MS = 300;

interface Theme {
  value: string;
  label: string;
}

const Editor = ({
  code,
  setCode,
  fileType,
  sendDiff,
  showSettings,
  setShowSettings,
  onDirtyChange,
}: {
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  fileType: string;
  sendDiff: (patch: string) => void;
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  /**
   * Fired only when the pending/synced state actually flips, never per
   * keystroke — the tab strip's dot needs two events per typing burst, and
   * this component must not re-render Monaco for anything less.
   */
  onDirtyChange?: (dirty: boolean) => void;
}) => {
  const editorRef = useRef<any>(null);
  const [language, setLanguage] = useState<string>("javascript");
  const [theme, setTheme] = useState<string>(EDITOR_THEME_NAME);
  const prevCodeRef = useRef<string>(code);
  /** The buffer as of the last keystroke, whether or not it has synced. */
  const latestCodeRef = useRef<string>(code);
  const pendingFlushRef = useRef<number | null>(null);
  /** Mirrors whether a flush is queued, so the callback fires on edges only. */
  const dirtyRef = useRef(false);
  const [fontSize, setFontSize] = useState<number>(14);
  const [editor, setEditor] = useState<any>(null);
  const [wordWrap, setWordWrap] = useState<"off" | "on" | "wordWrapColumn">(
    "on",
  );
  const [minimap, setMinimap] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    const detectedLang = detectLanguageFromExtension(fileType);
    if (detectedLang) {
      setLanguage(detectedLang);
    }
  }, [fileType]);

  // Update Prev Code Ref on code change
  useEffect(() => {
    if (prevCodeRef.current != code) {
      prevCodeRef.current = code;
      latestCodeRef.current = code;
    }
  }, [code]);

  // An eighteen-entry `languages` list used to live here. It was passed to the
  // settings panel, destructured there, and never rendered — the editor takes
  // its language from the open file's extension, which is the only correct
  // source for it.
  const themes: Theme[] = useMemo(
    () => [
      { value: EDITOR_THEME_NAME, label: "DevEx" },
      { value: "vs-dark", label: "Dark" },
      { value: "vs", label: "Light" },
      { value: "hc-black", label: "High Contrast" },
    ],
    [],
  );

  // Editor options memoized to prevent unnecessary re-renders
  const editorOptions: editor.IStandaloneEditorConstructionOptions = useMemo(
    () => ({
      fontSize,
      // next/font hashes the family name, so it has to come from the loader.
      fontFamily: mono.style.fontFamily,
      wordWrap,
      minimap: { enabled: minimap },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      bracketPairColorization: { enabled: true },
      suggest: { showKeywords: true, showSnippets: true },
      quickSuggestions: true,
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: "on",
      folding: true,
      lineNumbers: "on" as editor.LineNumbersType,
    }),
    [fontSize, wordWrap, minimap],
  );

  /**
   * Diff the buffer against the last synced copy and ship the patch.
   *
   * `diff_match_patch` is O(n*m) on the two texts, so running it inline on
   * every keystroke made typing cost grow with file length — on a large file
   * that is a diff of the whole document per character, on the main thread,
   * between the keypress and the glyph appearing.
   *
   * Coalescing on a short idle window collapses a burst of typing into one
   * diff and one socket frame without the user ever noticing a delay. The
   * patch is still computed against `prevCodeRef`, so a coalesced run
   * produces exactly the patch the per-keystroke runs would have summed to.
   */
  const markDirty = useCallback(
    (dirty: boolean) => {
      if (dirtyRef.current === dirty) return;
      dirtyRef.current = dirty;
      onDirtyChange?.(dirty);
    },
    [onDirtyChange],
  );

  const flushDiff = useCallback(() => {
    pendingFlushRef.current = null;
    markDirty(false);

    const currentCode = latestCodeRef.current.replace(/\r\n/g, "\n");
    const prevCode = prevCodeRef.current.replace(/\r\n/g, "\n");
    if (currentCode === prevCode) return;

    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(prevCode, currentCode);
    const patchList = dmp.patch_make(prevCode, diffs);
    const patchText = dmp.patch_toText(patchList);

    if (patchText.trim()) {
      sendDiff(patchText);
      prevCodeRef.current = currentCode;
    }
  }, [sendDiff, markDirty]);

  function handleCodeChange(newValue: string) {
    latestCodeRef.current = newValue || "";
    markDirty(true);

    if (pendingFlushRef.current !== null) {
      window.clearTimeout(pendingFlushRef.current);
    }
    pendingFlushRef.current = window.setTimeout(flushDiff, DIFF_DEBOUNCE_MS);
  }

  // Never lose the tail of a burst: flush whatever is pending when the editor
  // goes away or the debounce identity changes.
  useEffect(() => {
    return () => {
      if (pendingFlushRef.current !== null) {
        window.clearTimeout(pendingFlushRef.current);
        flushDiff();
      }
    };
  }, [flushDiff]);

  const getFileExtension = (lang: string): string => {
    const extensions: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      cpp: "cpp",
      c: "c",
      csharp: "cs",
      php: "php",
      ruby: "rb",
      go: "go",
      rust: "rs",
      swift: "swift",
      kotlin: "kt",
      html: "html",
      css: "css",
      json: "json",
      xml: "xml",
      yaml: "yml",
      markdown: "md",
    };
    return extensions[lang] || "txt";
  };

  const detectLanguageFromExtension = (
    ext: string | undefined,
  ): string | undefined => {
    if (!ext) return undefined;
    const langMap: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      pyx: "python",
      pyi: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      cs: "csharp",
      php: "php",
      rb: "ruby",
      go: "go",
      rs: "rust",
      swift: "swift",
      kt: "kotlin",
      html: "html",
      css: "css",
      scss: "scss",
      sass: "sass",
      json: "json",
      xml: "xml",
      yml: "yaml",
      yaml: "yaml",
      md: "markdown",
      dockerfile: "dockerfile",
      sh: "shell",
      bash: "shell",
      zsh: "shell",
      sql: "sql",
      r: "r",
      scala: "scala",
      lua: "lua",
      perl: "perl",
      vim: "vim",
      toml: "toml",
      ini: "ini",
      env: "dotenv",
    };
    return langMap[ext.toLowerCase()];
  };

  /**
   * Register the theme *before* the editor is constructed.
   *
   * `onMount` is too late. `@monaco-editor/react` passes `theme` straight to
   * `monaco.editor.create`, so naming a theme Monaco has never been handed
   * makes it fall back to `vs-dark` — the editor came up in GitHub-ish blues
   * and oranges instead of our palette. `beforeMount` runs after the Monaco
   * instance exists but before the editor is created, which is exactly the
   * window this needs.
   */
  const handleEditorBeforeMount = useCallback((monaco: any) => {
    monaco.editor.defineTheme(EDITOR_THEME_NAME, editorTheme);
  }, []);

  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;

    // Add custom key bindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    editor.addCommand(monaco.KeyCode.F5, () => {
      handleRun();
    });
  }, []);

  const handleSave = useCallback(async (): Promise<void> => {
    setIsSaving(true);
    // Simulate save delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSaving(false);
  }, [code, language]);

  const handleRun = useCallback(async (): Promise<void> => {
    setIsRunning(true);
    // Simulate run delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRunning(false);
  }, [code, language]);

  const formatCode = useCallback((): void => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument").run();
    }
  }, []);

  // settings handler
  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const content = e.target?.result as string;
        setCode(content);
        if (editor) {
          editor.setValue(content);
        }
        // Try to detect language from file extension
        const ext = file.name.split(".").pop()?.toLowerCase();
        const detectedLang = detectLanguageFromExtension(ext);
        if (detectedLang) {
          setLanguage(detectedLang);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileDownload = useCallback((): void => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${getFileExtension(language)}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [code, language]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  const handleFullScreenChange = () => {
    setIsFullscreen((prev) => !prev);
  };

  const handleFontSizeChange = (newFontSize: number) => {
    setFontSize(newFontSize);
  };

  const handleWordWrapChange = (
    newWordWrap: "off" | "on" | "wordWrapColumn",
  ) => {
    setWordWrap(newWordWrap);
  };

  const handleMinimapChange = (newMinimap: boolean) => {
    setMinimap(newMinimap);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  return (
    <div
      className={`flex flex-col overflow-hidden bg-term-bg text-ink ${
        isFullscreen ? "fixed inset-0 z-50" : "h-full"
      }`}
    >
      <div className="relative flex-1 overflow-hidden">
        <div className="h-full">
          <MonacoEditor
            height="100%"
            language={language}
            theme={theme}
            value={code}
            onChange={(newValue) => handleCodeChange(newValue || "")}
            options={editorOptions}
            beforeMount={handleEditorBeforeMount}
            onMount={handleEditorMount}
          />
        </div>

      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 2px;
          background: var(--color-brand);
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 2px;
          background: var(--color-brand);
          cursor: pointer;
          border: none;
        }
      `}</style>
      {showSettings && (
        <EditorSettingsPopup
          language={language}
          isFullScreen={isFullscreen}
          theme={theme}
          fontSize={fontSize}
          wordWrap={wordWrap}
          minimap={minimap}
          themes={themes}
          onThemeChange={handleThemeChange}
          onFontSizeChange={handleFontSizeChange}
          onWordWrapChange={handleWordWrapChange}
          onMinimapChange={handleMinimapChange}
          onClose={handleCloseSettings}
          onUpload={handleUpload}
          onFileDownload={handleFileDownload}
          onFullScreenMode={handleFullScreenChange}
        />
      )}
    </div>
  );
};


/**
 * Memoised because the sandbox shell above it owns eleven pieces of chrome
 * state — sidebar open, active panel, settings dialog, terminal maximised and
 * so on. Without this, toggling any one of them re-rendered this subtree too.
 */
export default React.memo(Editor);
