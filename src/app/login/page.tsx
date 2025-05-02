import { Suspense } from "react";
import { Footer } from "@/app/footer";
import Link from "next/link";
import Image from "next/image";
import { LoginClientPage } from "./login-client-page"; // Import the new client component

// Keep the Server Component page structure
function LoginServerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Auth Header */}
      <div className="py-8 flex flex-col items-center justify-center">
        <Link href="/" className="flex items-center space-x-2 mb-6">
          <Image
            src="/panda-light.svg"
            alt="MentoPanda Logo"
            width={40}
            height={40}
            className="transition-transform duration-300 hover:scale-110"
          />
          <span className="font-semibold text-xl">MentoPanda</span>
        </Link>
        <h1 className="text-2xl font-semibold">
          {/* This part needs searchParams, so it's handled in LoginClientPage */}
          {/* We can add a generic title here or leave it blank */}
        </h1>
        <div className="h-1 w-16 bg-brand rounded-full mt-4"></div>
      </div>

      {/* Main Content - Render the Client Component */}
      <div className="flex-1 flex items-start justify-center px-4 pb-8">
        <LoginClientPage />
      </div>

      <Footer />
    </div>
  );
}

// The default export wraps the server page content in Suspense
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-background">
          {/* Simplified Loading Header */}
          <div className="py-8 flex flex-col items-center justify-center">
            <Link href="/" className="flex items-center space-x-2 mb-6">
              <Image
                src="/panda-light.svg"
                alt="MentoPanda Logo"
                width={40}
                height={40}
              />
              <span className="font-semibold text-xl">MentoPanda</span>
            </Link>
            <div className="h-1 w-16 bg-brand rounded-full mt-4"></div>
          </div>
          {/* Loading State for Card */}
          <div className="flex-1 flex items-start justify-center px-4 pb-8">
            <div className="w-full max-w-md h-[500px] bg-muted/50 animate-pulse rounded-lg border-t-4 border-t-brand"></div>
          </div>
          <Footer />
        </div>
      }
    >
      <LoginServerPage />
    </Suspense>
  );
}
