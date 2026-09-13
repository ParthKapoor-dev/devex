import { IconBrandNodejs, IconBrandPython } from "@tabler/icons-react";
import { Box } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The templates a workspace can start from.
 *
 * `key` is the S3 prefix the core service copies from (`templates/<key>/`), so
 * it is also the value stored on the REPL and returned by the API as
 * `template`. Do not rename a key without moving the bucket prefix.
 *
 * The icons used to be `bg-green-800` and `bg-blue-800` circles — raw Tailwind,
 * and between them the single most saturated thing on the dashboard. They wear
 * the language's own mark on a neutral chip instead.
 */

export interface Template {
  key: string;
  name: string;
  description: string;
  icon: ReactNode;
}

const CHIP =
  "size-8 shrink-0 rounded-sm border border-edge bg-raised p-1.5 text-ink-muted";

const templates = {
  node: {
    key: "node",
    name: "Node.js",
    description: "JavaScript and TypeScript, npm on the path",
    icon: <IconBrandNodejs className={CHIP} />,
  },
  python: {
    key: "python",
    name: "Python",
    description: "CPython 3 with pip and a virtualenv ready",
    icon: <IconBrandPython className={CHIP} />,
  },
} satisfies Record<string, Template>;

export type TemplateKey = keyof typeof templates;

/**
 * The template a REPL was actually created from.
 *
 * The dashboard used to infer this from the *name*: if the name contained
 * "python" it claimed Python, and otherwise it claimed Node. A workspace made
 * from the Python template and called "api" was labelled Node.js, confidently
 * and wrongly, on every row.
 *
 * The API has returned the real value all along — `template` on the REPL. The
 * frontend type had it as an optional `templateKey`, a field the server never
 * sends, so it was always undefined and nobody noticed.
 *
 * An unrecognised key is reported as itself rather than silently rounded to
 * Node, because that is the case where guessing does the most damage.
 */
export function resolveTemplate(key: string | undefined): Template {
  if (key && key in templates) {
    return templates[key as TemplateKey];
  }

  return {
    key: key ?? "unknown",
    name: key || "Unknown template",
    description: key
      ? "Not one of the templates this build knows about"
      : "This workspace predates template tracking",
    icon: <Box className={CHIP} />,
  };
}

export default templates;
