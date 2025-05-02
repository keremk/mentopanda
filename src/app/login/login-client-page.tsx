"use client";

import { login, signup, githubSignIn, googleSignIn } from "@/app/login/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { SiGoogle, SiGithub } from "@icons-pack/react-simple-icons";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { getLastAuthProvider } from "@/lib/store-auth-provider";
import { useSearchParams } from "next/navigation";

export function LoginClientPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const mode = searchParams.get("mode");

  const isSignUp = mode === "signup";
  const [lastProvider, setLastProvider] = useState<string | null>(null);

  useEffect(() => {
    setLastProvider(getLastAuthProvider());
  }, []);

  return (
    <Card className="w-full max-w-md border-t-4 border-t-brand shadow-md">
      <CardContent className="pt-6 pb-4 space-y-6">
        {/* OAuth Providers */}
        <form className="space-y-4">
          <Button
            formAction={githubSignIn}
            className="w-full transition-all duration-200 hover:shadow-md"
            variant="outline"
          >
            <SiGithub className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>
          <Button
            formAction={googleSignIn}
            className="w-full transition-all duration-200 hover:shadow-md"
            variant="outline"
          >
            <SiGoogle className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email Form */}
        <form className="space-y-4">
          <div className="space-y-2">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              className="w-full"
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              className="w-full"
              required
            />
          </div>

          {!isSignUp && (
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm underline hover:text-brand transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          )}

          {isSignUp && (
            <div className="text-sm text-muted-foreground">
              By clicking Continue, you agree to our{" "}
              <Link
                href="/terms"
                className="underline hover:text-brand transition-colors"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="underline hover:text-brand transition-colors"
              >
                Privacy Policy
              </Link>
              .
            </div>
          )}

          <Button
            formAction={isSignUp ? signup : login}
            className="w-full"
            variant="brand"
          >
            {isSignUp ? "Create account" : "Sign in"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        {message && (
          <p className="text-sm text-red-500 text-center w-full p-2 border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 rounded-md">
            {message}
          </p>
        )}
        <p className="text-sm text-muted-foreground text-center">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <Link
                href="/login?mode=signin"
                className="underline hover:text-brand transition-colors"
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <Link
                href="/login?mode=signup"
                className="underline hover:text-brand transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </p>

        {lastProvider && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            Hint: You last logged in with{" "}
            <span className="capitalize font-medium">{lastProvider}</span>.
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
