// commands/basic.ts
import templates from "@/lib/templates";
import { Command } from "@/types/dashboard";

const ASCII_BANNER = `

  ██████╗ ███████╗██╗   ██╗██╗  ██╗            ██████╗██╗      ██████╗ ██╗   ██╗██████╗     ██╗██████╗ ███████╗
  ██╔══██╗██╔════╝██║   ██║╚██╗██╔╝    ██╗    ██╔════╝██║     ██╔═══██╗██║   ██║██╔══██╗    ██║██╔══██╗██╔════╝
  ██║  ██║█████╗  ██║   ██║ ╚███╔╝     ╚═╝    ██║     ██║     ██║   ██║██║   ██║██║  ██║    ██║██║  ██║█████╗
  ██║  ██║██╔══╝  ╚██╗ ██╔╝ ██╔██╗     ██╗    ██║     ██║     ██║   ██║██║   ██║██║  ██║    ██║██║  ██║██╔══╝
  ██████╔╝███████╗ ╚████╔╝ ██╔╝ ██╗    ╚═╝    ╚██████╗███████╗╚██████╔╝╚██████╔╝██████╔╝    ██║██████╔╝███████╗
  ╚═════╝ ╚══════╝  ╚═══╝  ╚═╝  ╚═╝            ╚═════╝╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝     ╚═╝╚═════╝ ╚══════╝

`;

export const helpCommand: Command = {
  name: "help",
  description: "Show available commands and getting started guide",
  usage: "help [command]",
  arguments: [
    {
      name: "command",
      description: "Specific command to get help for",
      required: false,
      type: "string",
    },
  ],
  execute: async (args, options, context) => {
    if (args.length > 0) {
      // Help for specific command would be handled by the command parser
      return `Use '${args[0]} --help' for detailed help on that command.`;
    }

    const commands = [
      {
        name: "help",
        description: "Lists all available commands and their descriptions",
      },
      {
        name: "version",
        description: "Displays the current version of the application",
      },
      {
        name: "status",
        description: "Shows the current operational status of the system",
      },
      {
        name: "templates",
        description:
          "Gives a list of all available project templates to kickstart your coding journey 🚀",
      },
      {
        name: "repl",
        description:
          "Launches an interactive Read-Eval-Print Loop (REPL) environment for quick code execution and testing",
      },
      {
        name: "clear",
        description: "Clears the terminal screen for a fresh start",
      },
      {
        name: "whoami",
        description:
          "Reveals your current user identity – because even machines need to know who's boss 😉",
      },
      {
        name: "ls",
        description:
          "Lists your created repls, showing you all the amazing projects you've been working on",
      },
      {
        name: "neofetch",
        description:
          "Displays a sleek, aesthetic system information script that proudly showcases your operating system and hardware details ✨",
      },
    ];

    const commandList = commands
      .map((cmd) => `  ${cmd.name.padEnd(12)} - ${cmd.description}`)
      .join("\n");

    console.log(commandList);

    return `╭─────────────────────────────────────────╮
│             AVAILABLE COMMANDS          │
╰─────────────────────────────────────────╯
${commandList}

╭─────────────────────────────────────────╮
│             GETTING STARTED             │
╰─────────────────────────────────────────╯
🚀 Quick Start Guide:
1. Create a new repl: repl create {name} {template}
2. Activate your repl: repl activate {name}
3. List all repls: repl list
4. List active repls: repl list --active

💡 Example workflow:
   repl create my-app node
   repl activate my-app
   ls --active

💡 Useful commands:
   repl list --detailed    - Show detailed repl info
   ls --active            - Show only active repls
   repl search {query}    - Search repls by name

Type {command} --help for detailed usage information.`;
  },
};

export const templatesCommand: Command = {
  name: "templates",
  description: "Show available templates for creating new repls",
  usage: "templates",
  execute: async (args, options, context) => {
    const templateList = Object.entries(templates)
      .map(([key, template]) => `  ${key.padEnd(12)} - ${template.name}`)
      .join("\n");
    return `╭─────────────────────────────────────────╮
│           AVAILABLE TEMPLATES           │
╰─────────────────────────────────────────╯
${templateList}

💡 Usage: repl create {name} {template}
   Example: repl create my-app node`;
  },
};

export const clearCommand: Command = {
  name: "clear",
  description: "Clear the terminal screen and reset history",
  usage: "clear",
  execute: async (args, options, context) => {
    context.setHistory([
      {
        type: "info",
        content: "🚀 devX Terminal v2.0.0 - Ready for commands",
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    return "";
  },
};

export const lsCommand: Command = {
  name: "ls",
  description: "List all repls (alias for 'repl list')",
  usage: "ls [--detailed] [--active]",
  options: [
    {
      flag: "--detailed",
      description: "Show detailed information about each repl",
      type: "boolean",
    },
    {
      flag: "--active",
      description: "Show only active repls",
      type: "boolean",
    },
  ],
  execute: async (args, options, context) => {
    try {
      const allRepls = await context.getRepls();

      // Filter repls based on --active flag
      const repls = options.active
        ? allRepls.filter((repl) => repl.isActive)
        : allRepls;

      if (repls.length === 0) {
        if (options.active) {
          return `📭 No active repls found.

🚀 Get started by activating a repl:
   ls
   repl activate {name}

💡 Or create a new repl: repl create my-app node`;
        }
        return `📭 No repls found.

🚀 Get started by creating your first repl:
   repl create my-app node
   repl activate my-app

💡 Use 'templates' to see available templates.`;
      }

      // Sort repls: active ones first, then inactive
      const sortedRepls = [...repls].sort((a, b) => {
        const aActive = a.isActive ? 1 : 0;
        const bActive = b.isActive ? 1 : 0;
        return bActive - aActive;
      });

      const detailed = options.detailed || options.d;
      if (detailed) {
        const header = options.active
          ? `╭─────────────────────────────────────────╮\n│            ACTIVE REPL DETAILS          │\n╰─────────────────────────────────────────╯`
          : `╭─────────────────────────────────────────╮\n│               REPL DETAILS              │\n╰─────────────────────────────────────────╯`;

        const replList = sortedRepls
          .map((repl) => {
            const isActive = repl.isActive;
            const statusIcon = isActive ? "🟢" : "⚪";
            const statusText = isActive ? "Running" : "Stopped";
            const actionCommand = isActive
              ? `🛑 Deactivate: repl deactivate ${repl.name}`
              : `🚀 Activate: repl activate ${repl.name}`;

            return `${statusIcon} ${repl.name} (ID: ${repl.id})
   👤 User: ${repl.user}
   ⚡ Status: ${statusText}
   ${actionCommand}`;
          })
          .join("\n\n");

        const footerText = options.active
          ? "💡 Use 'repl deactivate {name}' to stop any active repl."
          : "💡 Use 'repl activate {name}' or 'repl deactivate {name}' to manage repls.";

        return `${header}\n${replList}\n\n${footerText}`;
      }

      const header = options.active
        ? `╭─────────────────────────────────────────╮\n│              ACTIVE REPLS               │\n╰─────────────────────────────────────────╯`
        : `╭─────────────────────────────────────────╮\n│               ALL REPLS                 │\n╰─────────────────────────────────────────╯`;

      const replList = sortedRepls
        .map((repl, i) => {
          const isActive = repl.isActive;
          const statusIcon = isActive ? "🟢" : "⚪";
          const link = isActive
            ? ` - <a href="/repl/${repl.id}" class="text-info underline">Open</a>`
            : "";
          return `${i + 1}. ${statusIcon} 📁 ${repl.name} (${repl.id})${link}`;
        })
        .join("\n");

      const footerText = options.active
        ? "💡 Use 'repl deactivate {name}' to stop any repl or 'ls --detailed --active' for more info."
        : "💡 Use 'repl activate {name}' to activate a repl or 'ls --detailed' for more info.";

      return `${header}\n${replList}\n\n${footerText}`;
    } catch (error: any) {
      return `❌ Error fetching repls: ${error.message || "Unknown error"}`;
    }
  },
};

// Extras

export const whoamiCommand: Command = {
  name: "whoami",
  description: "Display current user information and session details",
  usage: "whoami",
  execute: async (args, options, context) => {
    return `╭─────────────────────────────────────────╮
│        ✨ DIGITAL IDENTITY CARD ✨        │
╰─────────────────────────────────────────╯
🆔 User Handle:  ${context.userName}
🏠 Personal Nexus: /home/${context.userName}
🚀 Command Conduit: devX Terminal v2.0.0
⏱️ Session Epoch:  ${new Date().toLocaleString()}

🌟 *Your journey begins now! Explore with 'repl create {name} {template}'*`;
  },
};

export const neofetchCommand: Command = {
  name: "neofetch",
  description: "Display system information in a stylized format",
  usage: "neofetch",
  execute: async (args, options, context) => {
    return `          _______
         /  ____  \\
        |  |____|  |
        |   ____   |
        |  |    |  |
        \\__|____|__/
─────────────────────────────────────────
             devX v2.0.0
─────────────────────────────────────────
 operating system   : devX Terminal
 shell interface    : Advanced CLI
 visual theme       : Dark Terminal
 operational status : Online

💡 *Ready for action! Launch a new project with 'repl create {name} {template}'*`;
  },
};

export const versionCommand: Command = {
  name: "version",
  description: "Show application version and system information",
  usage: "version",
  execute: async (args, options, context) => {
    return `╭─────────────────────────────────────────╮
│        🚀 DEVX CORE SPECS 🚀        │
╰─────────────────────────────────────────╯
💻 Version:      devX v2.0.0 - Next-Gen Terminal Interface
⚙️ Engine:       Built with React & TypeScript
✅ System Status: Online and Fully Operational

*Experience the future of coding!*`;
  },
};

export const statusCommand: Command = {
  name: "status",
  description: "Display comprehensive system status and metrics",
  usage: "status",
  execute: async (args, options, context) => {
    const uptime = Math.floor(Math.random() * 72) + 1;
    const repls = await context.getRepls();
    const activeRepls = repls.filter((repl) => repl.isActive);
    return `╭─────────────────────────────────────────╮
│      📈 SYSTEM VITAL SIGNS 📈       │
╰─────────────────────────────────────────╯
🌐 Network:      Online & Connected
🧠 CPU Load:     ${Math.floor(Math.random() * 30) + 10}% [Optimized]
💾 Memory Usage: ${Math.floor(Math.random() * 40) + 20}% [Stable]
📦 Disk Space:   ${Math.floor(Math.random() * 60) + 15}% [Ample]
⚡ Active Since: ${uptime}h ${Math.floor(Math.random() * 60)}m
🔄 Repls:        ${repls.length} total (${activeRepls.length} currently engaged)

🔍 *Dive deeper into active sessions: 'repl list --active'*`;
  },
};
