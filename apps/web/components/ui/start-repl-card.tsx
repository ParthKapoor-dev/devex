import Link from "next/link";
import { Terminal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useEffect, useState } from "react";

interface CardProps {
  link: string;
  replName: string;
  onClose: () => void;
}

export default function StartReplCard({ link, replName, onClose }: CardProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleClose = () => {
    setIsMounted(false);
    setTimeout(onClose, 300); // Match animation duration
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex h-screen w-full items-center justify-center transition-all duration-300 ${
        isMounted ? "bg-canvas/40 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <Card
        className={`w-full max-w-md border-dashed border-2 rounded-none shadow-none bg-surface transition-all duration-300 ${
          isMounted ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
      >
        <CardHeader className="border-b border-dashed pb-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            <span className="text-sm font-mono">
              Your {replName} Session Started
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="pt-6 pb-0 font-mono">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <span>status</span>
            </div>
            <div className="flex flex-col gap-1 pl-6">
              <p className="text-3xl font-bold">200</p>
              <p className="text-muted-foreground">Repl Session Started</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <div className="flex items-center">
                <span>locate_page</span>
                <span className="ml-1 h-5 w-2 animate-pulse bg-foreground inline-block" />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-6 border-t border-dashed mt-6 flex gap-4">
          <Button
            variant="outline"
            className="w-full rounded-none border-dashed hover:bg-raised"
            asChild
          >
            <Link href={link}>$ cd /{replName}</Link>
          </Button>
          <Button
            variant="destructive"
            className="w-full rounded-none"
            onClick={handleClose}
          >
            Close
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
