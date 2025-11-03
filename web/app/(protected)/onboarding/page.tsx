"use client";
import React, { useState } from "react";
import { useApi } from "@/lib/api";

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function OnboardingPage() {
  const api = useApi();

  const [roles, setRoles] = useState("");
  const [locations, setLocations] = useState("");
  const [industries, setIndustries] = useState("");
  const [minSalary, setMinSalary] = useState<string>("");
  const [remoteWeight, setRemoteWeight] = useState<string>("");

  React.useEffect(() => {
    (async () => {
      try {
        const p = await api.get("/me/preferences");
        if (p) {
          setRoles((p.roles || []).join(", "));
          setLocations((p.locations || []).join(", "));
          setIndustries((p.industries || []).join(", "));
          setMinSalary(p.minSalary?.toString() || "");
          setRemoteWeight(p.remoteWeight?.toString() || "");
        }
      } catch {}
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.put("/me/preferences", {
      roles: parseList(roles),
      locations: parseList(locations),
      industries: parseList(industries),
      minSalary: minSalary ? Number(minSalary) : undefined,
      remoteWeight: remoteWeight ? Number(remoteWeight) : undefined,
    });
    alert("Preferences saved");
  };

  return (
    <main>
      <h1>Onboarding</h1>
      <p>Tell us what you want. Comma-separate multiple items.</p>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 560 }}>
        <label>
          Roles
          <input value={roles} onChange={(e) => setRoles(e.target.value)} placeholder="e.g. Frontend Engineer, Fullstack" />
        </label>
        <label>
          Locations
          <input value={locations} onChange={(e) => setLocations(e.target.value)} placeholder="e.g. Remote, Berlin" />
        </label>
        <label>
          Industries
          <input value={industries} onChange={(e) => setIndustries(e.target.value)} placeholder="e.g. Fintech, AI" />
        </label>
        <label>
          Min Salary (USD)
          <input type="number" value={minSalary} onChange={(e) => setMinSalary(e.target.value)} placeholder="e.g. 90000" />
        </label>
        <label>
          Remote Weight (0-100)
          <input type="number" value={remoteWeight} onChange={(e) => setRemoteWeight(e.target.value)} placeholder="e.g. 80" />
        </label>
        <button type="submit">Save</button>
      </form>
    </main>
  );
}
