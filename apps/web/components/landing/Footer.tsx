"use client";

import { Github, ExternalLink, BookOpen } from "lucide-react";
import Link from "next/link";
import { DevExLogoDark } from "../icons/logo";

export default function Footer() {
  return (
    <footer className="relative z-10 mt-8 w-full overflow-hidden pb-8 pt-16 max-md:px-8">

      <div className="glass relative mx-auto flex max-w-6xl flex-col items-center gap-8 rounded-2xl px-6 py-10 md:flex-row md:items-start md:justify-between md:gap-12">
        <div className="flex flex-col items-center md:items-start">
          <Link href="/" className="mb-4 flex items-center gap-2">
            <DevExLogoDark height={35} width={35} />
            <span className="bg-gradient-to-br from-emerald-300 to-teal-400 bg-clip-text text-xl font-semibold tracking-tight text-transparent">
              devX
            </span>
          </Link>
          <p className="mb-6 max-w-lg text-center text-sm text-gray-300 md:text-left">
            DevX is an open-source cloud IDE platform where users can spin up
            live REPLs, code in the browser, and access full terminals — all
            powered by Kubernetes, S3, and GoLang. Think Replit, but fully
            self-hosted and customizable.
          </p>
        </div>

        <nav className="flex w-full flex-col gap-9 text-center md:w-auto md:flex-row md:justify-end md:text-left">
          <div>
            {/* Developer Info */}
            <Link
              href={"https://parthkapoor.me"}
              target="_blank"
              className="mb-4 flex items-center gap-3 rounded-lg bg-black/20 p-3 backdrop-blur-sm border border-teal-500/20"
            >
              <img
                src="https://github.com/parthkapoor-dev.png"
                alt="Parth Kapoor"
                className="h-10 w-10 rounded-full border-2 border-teal-400/30"
              />
              <div>
                <p className="text-sm font-medium text-gray-200">
                  Built by Parth Kapoor
                </p>
                <p className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors">
                  parthkapoor.me <ExternalLink className="h-3 w-3" />
                </p>
              </div>
            </Link>

            <div className="flex gap-4">
              <a
                href="https://github.com/parthkapoor-dev/devex"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
                className="flex items-center gap-2 rounded-lg bg-black/30 px-4 py-2 text-sm text-gray-300 transition-all hover:bg-black/40 hover:text-emerald-400 border border-gray-600/30"
              >
                <Github className="h-4 w-4" />
                Contribute
              </a>
              <Link
                href="/docs"
                aria-label="Documentation"
                className="flex items-center gap-2 rounded-lg bg-black/30 px-4 py-2 text-sm text-gray-300 transition-all hover:bg-black/40 hover:text-teal-400 border border-gray-600/30"
              >
                <BookOpen className="h-4 w-4" />
                Docs
              </Link>
            </div>
          </div>
        </nav>
      </div>
      <div className="relative z-10 mt-10 text-center text-xs text-gray-500">
        <span>&copy; 2025 devX. Open source and free to use.</span>
      </div>
    </footer>
  );
}
