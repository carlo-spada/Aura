"use client";
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "80vh" }}>
      <SignUp routing="path" signInUrl="/sign-in" />
    </main>
  );
}

