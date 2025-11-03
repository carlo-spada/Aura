"use client";
import React from "react";
import { useApi } from "@/lib/api";

const statuses = ["draft", "applied", "interviewing_1", "interviewing_2", "offer", "declined"];

export default function ApplicationsPage() {
  const api = useApi();
  const [apps, setApps] = React.useState<any[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const a = await api.get("/me/applications");
        setApps(a || []);
      } catch {}
    })();
  }, []);

  return (
    <main>
      <h1>Applications</h1>
      <div style={{ display: "grid", gap: 12 }}>
        {apps.map((a: any) => (
          <article key={a._id} style={{ border: "1px solid #333", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontWeight: 600 }}>{a.jobId}</div>
              <div style={{ marginLeft: "auto" }}>
                <select
                  value={a.status}
                  onChange={async (e) => {
                    const status = e.target.value;
                    await api.patch("/me/applications/status", { jobKey: a.jobKey ?? a.jobId, status });
                    setApps((prev) => prev.map((x) => (x.id === a.id ? { ...x, status } : x)));
                  }}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            {a.generatedDocs?.cvUrl && (
              <div style={{ marginTop: 8 }}>
                <a href={a.generatedDocs.cvUrl} target="_blank" rel="noreferrer">CV</a>
                {" "}|{" "}
                <a href={a.generatedDocs.clUrl} target="_blank" rel="noreferrer">Cover Letter</a>
              </div>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
