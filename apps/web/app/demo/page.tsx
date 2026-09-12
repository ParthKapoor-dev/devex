"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    router.push("https://www.youtube.com/embed/Tlck20bJeFE");
  }, []);
  return (
    <div className="fixed inset-0 flex text-3xl md:text-4xl h-screen w-screen items-center justify-center font-mono">
      Redirecting to yt demo
    </div>
  );
}
