"use client";

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
import { updatePassword, type State } from "./actions"; // Import State type
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending} variant="brand">
      {pending ? "Updating..." : "Update Password"}
    </Button>
  );
}

export default function UpdatePasswordPage() {
  const initialState: State = { message: undefined, errors: undefined };
  const [state, dispatch] = useActionState(updatePassword, initialState);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md border-t-4 border-t-brand shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Set Your New Password</CardTitle>
          <CardDescription>
            Please enter and confirm your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={dispatch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                aria-describedby="password-error"
              />
              {state?.errors?.password && (
                <p id="password-error" className="text-sm text-red-500">
                  {state.errors.password.join(", ")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                aria-describedby="confirmPassword-error"
              />
              {state?.errors?.confirmPassword && (
                <p id="confirmPassword-error" className="text-sm text-red-500">
                  {state.errors.confirmPassword.join(", ")}
                </p>
              )}
            </div>

            {/* Display General Error Message */}
            {state?.message && !state.errors && (
              <p className="text-sm text-red-500">{state.message}</p>
            )}

            <SubmitButton />
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          {/* Optionally add a link back to login if something goes wrong */}
          {state?.message && (
            <Button variant="link" asChild>
              <Link href="/login">Back to Login</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
