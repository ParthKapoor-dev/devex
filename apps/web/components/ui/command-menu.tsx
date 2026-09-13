"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { motion } from "motion/react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "./input";
import { useModifierKey } from "@/hooks/use-modifier-key";

/**
 * Render a shortcut token.
 *
 * This used to be `getModifierKey()`, which claimed to "detect OS" and then
 * unconditionally returned `⌘` — so every key cap in the palette told Linux
 * and Windows users to press a key their keyboard does not have, while the
 * handlers behind them all accept `metaKey || ctrlKey`.
 */
function ShortcutKey({ token }: { token: string }) {
  const modifier = useModifierKey();
  const apple = modifier === "⌘";

  const label =
    token === "cmd" || token === "⌘"
      ? modifier
      : token === "shift"
        ? "⇧"
        : token === "alt"
          ? apple
            ? "⌥"
            : "Alt"
          : token === "ctrl"
            ? apple
              ? "⌃"
              : "Ctrl"
            : token;

  return (
    <kbd className="pointer-events-none flex h-5 select-none items-center rounded border border-edge bg-raised px-1.5 font-mono text-[10px] text-ink-subtle">
      {label}
    </kbd>
  );
}

// Context for sharing state between components
interface CommandMenuContextType {
  value: string;
  setValue: (value: string) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  scrollType?: "auto" | "always" | "scroll" | "hover";
  scrollHideDelay?: number;
}

const CommandMenuContext = React.createContext<
  CommandMenuContextType | undefined
>(undefined);

const CommandMenuProvider: React.FC<{
  children: React.ReactNode;
  value: string;
  setValue: (value: string) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  scrollType?: "auto" | "always" | "scroll" | "hover";
  scrollHideDelay?: number;
}> = ({
  children,
  value,
  setValue,
  selectedIndex,
  setSelectedIndex,
  scrollType,
  scrollHideDelay,
}) => (
  <CommandMenuContext.Provider
    value={{
      value,
      setValue,
      selectedIndex,
      setSelectedIndex,
      scrollType,
      scrollHideDelay,
    }}
  >
    {children}
  </CommandMenuContext.Provider>
);

const useCommandMenu = () => {
  const context = React.useContext(CommandMenuContext);
  if (!context) {
    throw new Error("useCommandMenu must be used within CommandMenuProvider");
  }
  return context;
};

// Core CommandMenu component using Dialog
const CommandMenu = DialogPrimitive.Root;
const CommandMenuTrigger = DialogPrimitive.Trigger;
const CommandMenuPortal = DialogPrimitive.Portal;
const CommandMenuClose = DialogPrimitive.Close;

// Title components for accessibility
const CommandMenuTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-foreground",
      className,
    )}
    {...props}
  />
));
CommandMenuTitle.displayName = "CommandMenuTitle";

const CommandMenuDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CommandMenuDescription.displayName = "CommandMenuDescription";

// Overlay with backdrop blur
const CommandMenuOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
CommandMenuOverlay.displayName = "CommandMenuOverlay";

// Main content container with keyboard navigation
const CommandMenuContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showShortcut?: boolean;
    scrollType?: "auto" | "always" | "scroll" | "hover";
    scrollHideDelay?: number;
  }
>(
  (
    {
      className,
      children,
      showShortcut = true,
      scrollType = "hover",
      scrollHideDelay = 600,
      ...props
    },
    ref,
  ) => {
    const [value, setValue] = React.useState("");
    const [selectedIndex, setSelectedIndex] = React.useState(0);

    // There was a second document-level keydown listener here whose whole body
    // was `e.preventDefault()` under comments reading "Logic will be handled by
    // CommandMenuList". It handled nothing and swallowed the arrow keys twice.

    return (
      <CommandMenuPortal>
        <CommandMenuOverlay />
        <DialogPrimitive.Content asChild ref={ref} {...props}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "fixed left-[50%] top-[35%] z-50 w-[95%] max-w-2xl translate-x-[-50%] translate-y-[-50%]",
              "bg-background border border-border rounded-card shadow-lg",
              "overflow-hidden",
              className,
            )}
          >
            {" "}
            <CommandMenuProvider
              value={value}
              setValue={setValue}
              selectedIndex={selectedIndex}
              setSelectedIndex={setSelectedIndex}
              scrollType={scrollType}
              scrollHideDelay={scrollHideDelay}
            >
              <VisuallyHidden.Root>
                <CommandMenuTitle>Command Menu</CommandMenuTitle>
              </VisuallyHidden.Root>

              {children}

              <CommandMenuClose className="absolute end-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
                <X size={14} />
                <span className="sr-only">Close</span>
              </CommandMenuClose>

              {showShortcut && (
                <div className="absolute end-12 top-3 flex items-center gap-1">
                  <ShortcutKey token="cmd" />
                  <ShortcutKey token="K" />
                </div>
              )}
            </CommandMenuProvider>
          </motion.div>
        </DialogPrimitive.Content>
      </CommandMenuPortal>
    );
  },
);
CommandMenuContent.displayName = "CommandMenuContent";

// Input component for search
const CommandMenuInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    placeholder?: string;
  }
>(
  (
    { className, placeholder = "Type a command or search...", ...props },
    ref,
  ) => {
    const { value, setValue } = useCommandMenu();

    return (
      <div className="flex items-center border-b border-border px-3 py-0">
        <Search className="me-3 h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={cn(
            " focus-visible:outline-none focus-visible:border-0 flex h-12 w-full rounded-none border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          placeholder={placeholder}
          {...props}
        />
      </div>
    );
  },
);
CommandMenuInput.displayName = "CommandMenuInput";

// List container for command items with scroll area
const CommandMenuList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    maxHeight?: string;
  }
>(({ className, children, maxHeight = "300px", ...props }, _ref) => {
  const {
    selectedIndex,
    setSelectedIndex,
    scrollType = "hover",
    scrollHideDelay = 600,
  } = useCommandMenu();

  const hostRef = React.useRef<HTMLDivElement>(null);

  // Keyboard navigation.
  //
  // Scoped to this list rather than `document.querySelectorAll`, which would
  // pick up the items of any other palette mounted at the same time — the app
  // has two (this one and the sandbox file finder).
  //
  // `behavior: "smooth"` is gone: on held arrow keys it queues an animation per
  // press and the highlight visibly lags behind the keyboard.
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;

      const items = hostRef.current?.querySelectorAll("[data-command-item]");
      if (!items || items.length === 0) return;

      e.preventDefault();
      const maxIndex = items.length - 1;
      const newIndex =
        e.key === "ArrowDown"
          ? Math.min(selectedIndex + 1, maxIndex)
          : Math.max(selectedIndex - 1, 0);

      setSelectedIndex(newIndex);
      (items[newIndex] as HTMLElement | undefined)?.scrollIntoView({
        block: "nearest",
      });
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, setSelectedIndex]);

  return (
    <div ref={hostRef} className="p-1" {...props}>
      <ScrollArea
        className={cn("w-full", className)}
        // A *max* height, not a fixed one. It was `height`, so a palette with
        // three results still reserved 400px and sat there mostly empty.
        style={{ maxHeight }}
        type={scrollType}
        scrollHideDelay={scrollHideDelay}
      >
        <div className="flex flex-col gap-0.5 p-1">{children}</div>
      </ScrollArea>
    </div>
  );
});
CommandMenuList.displayName = "CommandMenuList";

// Command group with optional heading
const CommandMenuGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    heading?: string;
  }
>(({ className, children, heading, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props}>
    {heading && (
      <div className="label px-2.5 pb-1.5 pt-3 text-ink-subtle">{heading}</div>
    )}
    {children}
  </div>
));
CommandMenuGroup.displayName = "CommandMenuGroup";

// Individual command item
const CommandMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onSelect?: () => void;
    disabled?: boolean;
    shortcut?: string;
    icon?: React.ReactNode;
    index?: number;
  }
>(
  (
    {
      className,
      children,
      onSelect,
      disabled = false,
      shortcut,
      icon,
      index = 0,
      ...props
    },
    ref,
  ) => {
    const { selectedIndex, setSelectedIndex } = useCommandMenu();
    const isSelected = selectedIndex === index;

    // Handle click and enter key
    const handleSelect = React.useCallback(() => {
      if (!disabled && onSelect) {
        onSelect();
      }
    }, [disabled, onSelect]);

    // Only the selected row listens. Every row used to register its own
    // document-level handler and then check `isSelected` inside it, so a
    // twenty-item palette installed twenty global listeners to serve one.
    React.useEffect(() => {
      if (!isSelected) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        handleSelect();
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isSelected, handleSelect]);

    return (
      <div
        ref={ref}
        data-command-item
        className={cn(
          "relative flex cursor-default select-none items-center gap-2.5 rounded-md px-2.5 py-2",
          "text-sm text-ink-muted outline-none",
          "transition-colors duration-[--duration-fast]",
          isSelected && "bg-raised text-ink",
          disabled && "pointer-events-none opacity-50",
          className,
        )}
        onClick={handleSelect}
        onMouseEnter={() => setSelectedIndex(index)}
        {...props}
      >
        {icon && (
          <span
            className={cn(
              "flex size-4 shrink-0 items-center justify-center transition-colors duration-[--duration-fast]",
              // The accent marks the row you are on, and only that row.
              isSelected ? "text-brand" : "text-ink-subtle",
            )}
          >
            {icon}
          </span>
        )}

        <div className="min-w-0 flex-1">{children}</div>

        {shortcut && (
          <div className="ms-auto flex shrink-0 items-center gap-1">
            {shortcut.split("+").map((key) => (
              <ShortcutKey key={key} token={key} />
            ))}
          </div>
        )}
      </div>
    );
  },
);
CommandMenuItem.displayName = "CommandMenuItem";

// Separator between groups
const CommandMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
CommandMenuSeparator.displayName = "CommandMenuSeparator";

// Empty state
const CommandMenuEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children = "No results found.", ...props }, ref) => (
  <div
    ref={ref}
    className={cn("py-6 text-center text-sm text-muted-foreground", className)}
    {...props}
  >
    {children}
  </div>
));
CommandMenuEmpty.displayName = "CommandMenuEmpty";

// Hook for global keyboard shortcut
export const useCommandMenuShortcut = (callback: () => void) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        callback();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [callback]);
};

export const useDocsShortcut = (callback: () => void) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        callback();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [callback]);
};

// Hook for global keyboard shortcut
export const useFinderMenuShortcut = (callback: () => void) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        callback();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [callback]);
};

export {
  CommandMenu,
  CommandMenuTrigger,
  CommandMenuContent,
  CommandMenuTitle,
  CommandMenuDescription,
  CommandMenuInput,
  CommandMenuList,
  CommandMenuEmpty,
  CommandMenuGroup,
  CommandMenuItem,
  CommandMenuSeparator,
  CommandMenuClose,
  useCommandMenu,
};
