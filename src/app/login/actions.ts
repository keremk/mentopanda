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

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword(
    validatedFields.data
  );

  if (error) {
    return redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  return redirect("/home?auth_provider=email");
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

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp(validatedFields.data);

  if (error) {
    return redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  if (data.user && data.session) {
    // If we have a user and session, it means email confirmation is disabled
    // or the user was automatically confirmed
    revalidatePath("/", "layout");
    return redirect("/onboard?auth_provider=email");
  } else {
    // Email confirmation is required
    return redirect(
      `/login?message=${encodeURIComponent(
        "We sent you an email, please confirm your email to continue"
      )}`
    );
  }
}

const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    "http://localhost:3000/";
  // Make sure to include `https://` when not localhost.
  url = url.startsWith("http") ? url : `https://${url}`;
  // Make sure to include a trailing `/`.
  url = url.endsWith("/") ? url : `${url}/`;
  return url;
};

export async function githubSignIn() {
  /* IMPORTANT (Local Development): In order for the redirectUrl to work, you need to change config.toml file to have the correct site_url and additional_redirect_urls that match the
  URL provided below. I wasted hours on this, so beware.
  For Production you need to change the Authentication->URL Configuration in Supabase Studio.
  VERY IMPORTANT: You need to provide the full URL including the protocol (http or https) + and the full path (e.g. https://example.com/auth/callback)
  Supabase Studio in local does not have this UI, so you need to use config.toml file.
  */

  const supabase = await createClient();

  const redirectUrl = `${getURL()}auth/callback`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: redirectUrl,
    },
  });

  if (error) {
    console.error("error", error.message);
    return redirect("/login?message=Could not authenticate with GitHub");
  }

  return redirect(data.url);
}

export async function googleSignIn() {
  const supabase = await createClient();

  const redirectUrl = `${getURL()}auth/callback`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
    },
  });

  if (error) {
    console.error("error", error.message);
    return redirect("/login?message=Could not authenticate with Google");
  }

  return redirect(data.url);
}
