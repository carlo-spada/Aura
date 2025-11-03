"use client";
import { useAuth } from "@clerk/nextjs";

export function useApi() {
  const { getToken } = useAuth();
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  async function request(path: string, init?: RequestInit) {
    const t = await getToken({ template: "default" }).catch(() => null);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    };
    if (t) headers["Authorization"] = `Bearer ${t}`;
    const res = await fetch(`${base}${path}`, { ...init, headers });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return text as any;
    }
  }

  return {
    get: (p: string) => request(p),
    post: (p: string, body?: any) => request(p, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
    put: (p: string, body?: any) => request(p, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
    patch: (p: string, body?: any) => request(p, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  };
}

