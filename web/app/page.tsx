"use client";
import React from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>AURA</h1>
      <p>Autonomous Job Copilot — Web scaffold is running.</p>
      <SignedOut>
        <p>
          <SignInButton mode="modal">Sign in</SignInButton> to get started, or visit {" "}
          <Link href="/sign-in">/sign-in</Link>
        </p>
      </SignedOut>
      <SignedIn>
        <p>
          You are signed in. Go to <Link href="/onboarding">Onboarding</Link> or <Link href="/dashboard">Dashboard</Link>.
        </p>
      </SignedIn>
      <ul>
        <li>Clerk: configure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY & CLERK_SECRET_KEY</li>
        <li>API: configure NEXT_PUBLIC_API_URL</li>
      </ul>
    </main>
  );
}
