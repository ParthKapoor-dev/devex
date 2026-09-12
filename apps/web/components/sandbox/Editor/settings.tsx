import {
  Settings,
  X,
  Type,
  Palette,
  Monitor,
  Eye,
  Code2,
  Maximize2,
  Download,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useEffect, useState, useRef } from "react";
import ModernCheckbox from "@/components/ui/modern-checkbox";

interface Theme {
  value: string;
  label: string;
}

interface SettingsPopupProps {
  // Current settings
  isFullScreen: boolean;
  language: string;
  theme: string;
  fontSize: number;
  wordWrap: "off" | "on" | "wordWrapColumn";
  minimap: boolean;

  // Available options
  languages: string[];
  themes: Theme[];

  // Handlers
  onThemeChange: (theme: string) => void;
  onFontSizeChange: (fontSize: number) => void;
  onWordWrapChange: (wordWrap: "off" | "on" | "wordWrapColumn") => void;
  onMinimapChange: (minimap: boolean) => void;
  onClose: () => void;
  onFileDownload: () => void;
  onFullScreenMode: () => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function EditorSettingsPopup({
  language,
  isFullScreen,
  theme,
  fontSize,
  wordWrap,
  minimap,
  languages,
  themes,
  onThemeChange,
  onFontSizeChange,
  onWordWrapChange,
  onMinimapChange,
  onClose,
  onUpload,
  onFileDownload,
  onFullScreenMode,
}: SettingsPopupProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [localFontSize, setLocalFontSize] = useState(fontSize);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleClose = () => {
    setIsMounted(false);
    setTimeout(onClose, 300); // Match animation duration
  };

  const handleFontSizeChange = (value: number) => {
    setLocalFontSize(value);
    onFontSizeChange(value);
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await onFileDownload();
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      setIsUploading(true);
      await onUpload(event);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      // Reset the input value to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFullScreenToggle = () => {
    try {
      onFullScreenMode();
    } catch (error) {
      console.error("Fullscreen toggle failed:", error);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex h-screen w-full items-center justify-center transition-all duration-300 ${
        isMounted ? "bg-canvas/40 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <Card
        className={`w-full max-w-lg border-dashed border-2 border-zinc-400 rounded-none shadow-none bg-surface transition-all duration-300 max-h-[80vh] overflow-scroll ${
          isMounted ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
      >
        <CardHeader className="border-b border-dashed pb-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-brand" />
            <span className="text-sm font-mono">Editor Configuration</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="font-mono flex-col flex gap-6">
          {/* Theme Selection */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-brand" />
              <span className="text-sm font-medium">Theme</span>
            </div>
            <select
              value={theme}
              onChange={(e) => onThemeChange(e.target.value)}
              className="w-full bg-raised border border-edge rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {themes.map((themeOption) => (
                <option key={themeOption.value} value={themeOption.value}>
                  {themeOption.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div className="flex gap-4 flex-col">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-brand" />
              <span className="text-sm font-medium">Font Size</span>
              <span className="text-xs text-ink-subtle">({localFontSize}px)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-subtle">10</span>
              <input
                type="range"
                min="10"
                max="24"
                value={localFontSize}
                onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-xs text-ink-subtle">24</span>
            </div>
          </div>

          {/* Word Wrap */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-brand" />
              <span className="text-sm font-medium">Word Wrap</span>
            </div>
            <select
              value={wordWrap}
              onChange={(e) =>
                onWordWrapChange(
                  e.target.value as "off" | "on" | "wordWrapColumn",
                )
              }
              className="w-full bg-raised border border-edge rounded-none px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="off">Off</option>
              <option value="on">On</option>
              <option value="wordWrapColumn">Word Wrap Column</option>
            </select>
          </div>

          {/* Minimap Toggle */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-brand" />
              <span className="text-sm font-medium">Minimap</span>
            </div>
            <ModernCheckbox
              checked={minimap}
              onChange={(e) => onMinimapChange(e.target.checked)}
            />
          </div>

          {/* Fullscreen Mode Toggle */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Maximize2 className="h-4 w-4 text-brand" />
              <span className="text-sm font-medium">Fullscreen Mode</span>
            </div>
            <ModernCheckbox
              checked={isFullScreen}
              onChange={handleFullScreenToggle}
            />
          </div>

          {/* File Operations */}
          <div className="flex gap-4 flex-col">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-brand" />
              <span className="text-sm font-medium">File Operations</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex-1 rounded-none border-dashed border-zinc-600 hover:bg-zinc-700 hover:border-brand transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? "Downloading..." : "Download"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUploadClick}
                disabled={isUploading}
                className="flex-1 rounded-none border-dashed border-zinc-600 hover:bg-zinc-700 hover:border-brand transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".txt,.js,.jsx,.ts,.tsx,.py,.html,.css,.json,.md,.xml,.yaml,.yml,.sql,.sh,.bat,.cpp,.c,.java,.php,.rb,.go,.rs,.swift,.kt,.scala,.clj,.elm,.hs,.ml,.fs,.pl,.r,.m,.dart,.vue,.svelte"
              aria-label="Upload file"
            />
          </div>

          {/* Status Display */}
          <div className="mt-6 pt-4 border-t border-dashed border-edge">
            <div className="flex items-center gap-2">
              <span className="text-brand">$</span>
              <span className="text-sm">editor.getConfiguration()</span>
            </div>
            <div className="pl-6 mt-2 text-xs text-ink-subtle flex flex-col gap-1">
              <div>language: {language}</div>
              <div>theme: {themes.find((t) => t.value === theme)?.label}</div>
              <div>fontSize: {localFontSize}px</div>
              <div>wordWrap: {wordWrap}</div>
              <div>minimap: {minimap ? "enabled" : "disabled"}</div>
              <div>fullscreen: {isFullScreen ? "enabled" : "disabled"}</div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-6 border-t border-dashed mt-1 flex gap-4">
          <Button
            variant="outline"
            className="w-full rounded-none border-dashed hover:bg-zinc-600"
            onClick={handleClose}
          >
            $ apply --changes
          </Button>
          <Button
            variant="destructive"
            className="w-full rounded-none"
            onClick={handleClose}
          >
            Close
          </Button>
        </CardFooter>
      </Card>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
        }
      `}</style>
    </div>
  );
}
