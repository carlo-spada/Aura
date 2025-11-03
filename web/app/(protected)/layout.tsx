"use client";
import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React from "react";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <header style={{ display: "flex", gap: 16, alignItems: "center", padding: 16 }}>
          <Link href="/">AURA</Link>
          <nav style={{ display: "flex", gap: 12 }}>
            <Link href="/onboarding">Onboarding</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/applications">Applications</Link>
          </nav>
          <div style={{ marginLeft: "auto" }}>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
        <div style={{ padding: 16 }}>{children}</div>
      </SignedIn>
    </>
  );
}
