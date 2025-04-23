import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react"; // Or another suitable icon

export default function AuthCodeErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md border-t-4 border-t-destructive shadow-md">
        {" "}
        {/* Use destructive color for error */}
        <CardHeader className="text-center">
          <div className="mx-auto bg-destructive/10 rounded-full p-3 w-fit">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl mt-4">Authentication Failed</CardTitle>
          <CardDescription>
            Sorry, we couldn&apos;t sign you in. This might be due to an expired
            or invalid link.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Please try signing in again or return to the homepage.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild variant="brand">
            <Link href="/login">Try Again</Link>
          </Button>
          <Button asChild variant="ghost-brand">
            <Link href="/">Go Home Page</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
