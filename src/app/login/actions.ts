"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(formData: FormData) {
  const validatedFields = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return redirect(
      `/login?message=${encodeURIComponent("Invalid email or password")}`
    );
  }

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword(
    validatedFields.data
  );

  if (error) {
    return redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  return redirect("/home");
}

export async function signup(formData: FormData) {
  const validatedFields = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return redirect(
      `/login?message=${encodeURIComponent("Invalid email or password")}`
    );
  }

  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp(validatedFields.data);

  if (error) {
    return redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  if (data.user && data.session) {
    // If we have a user and session, it means email confirmation is disabled
    // or the user was automatically confirmed
    revalidatePath("/", "layout");
    return redirect("/home");
  } else {
    // Email confirmation is required
    return redirect(
      `/login?message=${encodeURIComponent(
        "We sent you an email, please confirm your email to continue"
      )}`
    );
  }
}

export async function githubSignIn() {
  /* IMPORTANT (Local Development): In order for the redirectUrl to work, you need to change config.toml file to have the correct site_url and additional_redirect_urls that match the
  URL provided below. I wasted hours on this, so beware.
  For Production you need to change the Authentication/URL Configuration in Supabase Studio.
  Supabase Studio in local does not have this UI, so you need to use config.toml file.
  */ 

  const supabase = createClient();

  const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
  console.log("Providing redirect URL as such: ", redirectUrl);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: redirectUrl,
    },
  });
  console.log("data ", data);

  if (error) {
    console.log("error", error.message);
    return redirect("/login?message=Could not authenticate with GitHub");
  }

  return redirect(data.url);
}
