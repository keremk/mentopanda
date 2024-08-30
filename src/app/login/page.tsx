import { login, signup, githubSignIn } from "@/app/login/actions";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import GitHubIcon from "@/components/icons/github";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="mt-8 space-y-6">
          <form className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                className="w-full"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full"
                required
              />
            </div>
            <div className="flex space-x-4">
              <Button formAction={login} className="flex-1 px-12 py-2">
                Sign In
              </Button>
              <Button
                formAction={signup}
                className="flex-1 px-12 py-2"
                variant="outline"
              >
                Sign Up
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Or continue with
          </div>
          <form>
            <div className="mt-4">
              <Button formAction={githubSignIn} className="w-full">
                <GitHubIcon className="mr-2 h-4 w-4" />
                GitHub
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          {searchParams?.message && (
            <p className="text-sm text-muted-foreground text-center w-full">
              {searchParams.message}
            </p>
          )}
        </CardFooter>
      </Card>
      <Link
        href="/"
        className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>{" "}
        Back
      </Link>
    </div>
  );
}
