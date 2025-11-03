"use client";
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "80vh" }}>
      <SignIn routing="path" signUpUrl="/sign-up" />
    </main>
  );
}

