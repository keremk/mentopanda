"use client"; // Need client for useFormState

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { requestPasswordReset, type State } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending} variant="brand">
      {pending ? "Sending..." : "Send Reset Instructions"}
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const initialState: State = {
    message: undefined,
    success: undefined,
    errors: undefined,
  };
  const [state, dispatch] = useActionState(requestPasswordReset, initialState);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md border-t-4 border-t-brand shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you instructions to
            reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={dispatch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                aria-describedby="email-error"
              />
              {state?.errors?.email && (
                <p id="email-error" className="text-sm text-red-500">
                  {state.errors.email.join(", ")}
                </p>
              )}
            </div>

            {/* Display Success or Generic Error Message */}
            {state?.message && !state.errors?.email && (
              <p
                className={`text-sm ${
                  state.success ? "text-green-600" : "text-red-500"
                }`}
              >
                {state.message}
              </p>
            )}

            <SubmitButton />
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" asChild>
            <Link href="/login">Back to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
