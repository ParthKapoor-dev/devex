"use client";

import { useState } from "react";
import { Copy, ExternalLink, Play } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import Link from "next/link";

const URLConverter = ({
  className,
  isVisible,
  replId,
}: {
  className?: string;
  isVisible: boolean;
  replId: string;
}) => {
  const [port, setPort] = useState("5000");
  const [route, setRoute] = useState("/ping");
  const [copied, setCopied] = useState(false);

  const domainName =
    "https://" +
    (process.env.NEXT_PUBLIC_RUNNER_DOMAIN_NAME || "localhost:8081");

  // Generate the converted URL
  const convertedUrl = `${domainName}/${replId}/user-app/${port}${route.startsWith("/") ? route : "/" + route}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(convertedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(convertedUrl, "_blank");
  };

  return (
    <div
      className={`bg-gray-50 border-t h-full ${className} ${!isVisible ? "hidden" : ""}`}
    >
      <div className="p-4 flex flex-col gap-4">
        {/* Input Section */}
        <div className="flex gap-3 text-black ">
          {/* Original URL Display */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Original URL
            </label>
            <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm font-mono text-gray-600">
              http://localhost:
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Port
              </label>
              <Input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="4000"
              />
            </div>
            <div className="flex-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Route
              </label>
              <Input
                type="text"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="/some/route/"
              />
            </div>
          </div>
        </div>

        {/* Converted URL Section */}
        <div className="py-4">
          <label className="block text-xs font-medium text-gray-700">
            Converted URL
          </label>
          <div className="flex gap-3 justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-green-50 border border-green-200 rounded-md text-sm font-mono text-green-800 break-all">
                {convertedUrl}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleCopy}
                size="sm"
                className="flex items-center gap-2 bg-black"
              >
                <Copy className="h-3 w-3" />
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Link href={convertedUrl} target="_blank">
                <Button variant="ghost" className="flex items-center gap-2 border border-edge bg-term-bg text-ink" size="sm">
                  <ExternalLink className="h-3 w-3" />
                  Open
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500">✓ URL ready to use</div>
        </div>
      </div>
    </div>
  );
};

export default URLConverter;
