import type { Metadata } from "next";
import { MockSwitcher } from "@/components/mocks/switcher";

/**
 * MOCKS — throwaway design directions for the landing and login pages.
 * Not linked from anywhere, not in the sitemap, and noindex. Delete the whole
 * `app/mocks` + `components/mocks` tree once a direction is picked.
 */
export const metadata: Metadata = {
  title: "Design mocks",
  robots: { index: false, follow: false },
};

export default function MocksLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <MockSwitcher />
    </>
  );
}
