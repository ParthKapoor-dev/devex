import Link from "next/link";
import { Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background">
      <Card className="w-full max-w-md border-dashed border-2 rounded-none shadow-none">
        <CardHeader className="border-b border-dashed pb-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            <span className="text-sm font-mono">system_error.sh</span>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-0 font-mono">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <span>status</span>
            </div>
            <div className="flex flex-col gap-1 pl-6">
              <p className="text-3xl font-bold">404</p>
              <p className="text-muted-foreground">Page not found</p>
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
        <CardFooter className="pt-6 border-t border-dashed mt-6">
          <Button
            variant="outline"
            className="w-full rounded-none border-dashed"
            asChild
          >
            <Link href="/">$ cd /home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
