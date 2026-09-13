import type { Metadata } from "next";
import { BlocksLogin } from "@/components/mocks/blocks/login-view";

// MOCK — direction B · Blocks, login.

export const metadata: Metadata = {
  title: "Mock B · Blocks · Sign in",
};

export default function BlocksLoginMockPage() {
  return <BlocksLogin />;
}
