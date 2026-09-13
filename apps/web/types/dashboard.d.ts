export interface Repl {
  id: string;
  name: string;
  template: string;
  createdAt: string;
}

export interface StoredRepl {
  id: string;
  name: string;
  user: string;
  /** Was `bool`, which is not a TypeScript type. */
  isActive: boolean;
  /**
   * The template the workspace was created from, and the S3 prefix its files
   * were copied out of. Matches `Template` on `apps/core/models/repl.go`.
   *
   * This was declared as `templateKey`, a name the server has never sent, so
   * it was `undefined` on every REPL — which is why the dashboard fell back to
   * guessing the template from the workspace's name.
   */
  template: string;
}

export interface HistoryEntry {
  type: "command" | "output" | "error" | "success" | "info";
  content: string;
  timestamp: string;
}

export interface CommandExecutionContext {
  userName: string;
  getRepls: () => Promise<StoredRepl[]>;
  createRepl: (templateKey: string, replName: string) => Promise<void>;
  startRepl: (replId: string) => Promise<void>;
  deleteReplSession: (replId: string) => Promise<void>;
  setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
  repls: StoredRepl[];
  setRepls: React.Dispatch<React.SetStateAction<StoredRepl[]>>;
}

export interface CommandArgument {
  name: string;
  description: string;
  required: boolean;
  type: "string" | "number" | "boolean";
  choices?: string[];
}

export interface CommandOption {
  flag: string;
  description: string;
  type: "string" | "number" | "boolean";
}

export interface ParsedCommand {
  command: string;
  subcommand?: string;
  args: string[];
  options: Record<string, any>;
}

export interface SubCommand {
  name: string;
  description: string;
  usage: string;
  arguments?: CommandArgument[];
  options?: CommandOption[];
  execute: (
    args: string[],
    options: Record<string, any>,
    context: CommandExecutionContext,
  ) => Promise<string> | string;
  suggestions?: (
    args: string[],
    context: CommandExecutionContext,
  ) => Promise<string[]> | string[];
}

export interface Command {
  name: string;
  description: string;
  usage: string;
  arguments?: CommandArgument[];
  options?: CommandOption[];
  subcommands?: Record<string, SubCommand>;
  execute: (
    args: string[],
    options: Record<string, any>,
    context: CommandExecutionContext,
  ) => Promise<string> | string;
  suggestions?: (
    args: string[],
    context: CommandExecutionContext,
  ) => Promise<string[]> | string[];
}

export interface CommandRegistry {
  [key: string]: Command;
}

// Legacy types for backward compatibility
export interface Commands {
  [key: string]: {
    description: string;
    usage: string;
    execute: (args: string[], context: any) => Promise<string> | string;
  };
}

export interface CommandContext {
  repls: StoredRepl[];
  setRepls: React.Dispatch<React.SetStateAction<StoredRepl[]>>;
  setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
}
