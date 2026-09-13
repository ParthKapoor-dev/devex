import type { MDXComponents } from "mdx/types";
import { mdxComponents } from "@/components/docs/mdx-components";

/**
 * Required by `@next/mdx`: every MDX file rendered in the App Router picks up
 * the components returned here. Keeping the actual map in
 * `components/docs/mdx-components` lets non-MDX callers import it too.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...mdxComponents, ...components };
}
