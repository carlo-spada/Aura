"use client";
import React from "react";
import { useApi } from "@/lib/api";

type Job = {
  id: number;
  source: string;
  external_id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
};

function jobKey(j: Job) {
  return `${j.source}:${j.external_id}`;
}

export default function DashboardPage() {
  const [q, setQ] = React.useState("engineer");
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [loading, setLoading] = React.useState(false);

  const api = useApi();
  const [ratings, setRatings] = React.useState<{ jobKey: string; stars: number }[]>([]);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const rankedFetch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/rank?q=${encodeURIComponent(q)}&k=50&top=6`);
      const data = await res.json();
      setJobs((data.ranked || []).map((r: any) => r.job));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const ingestAndFetch = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/ingest/remoteok?q=${encodeURIComponent(q)}&limit=100`, { method: "POST" });
      await rankedFetch();
    } finally {
      setLoading(false);
    }
  };

  const rate = async (j: Job, stars: number) => {
    await api.put("/me/ratings", { jobKey: jobKey(j), stars });
    setRatings((prev) => {
      const others = prev.filter((x) => x.jobKey !== jobKey(j));
      return [...others, { jobKey: jobKey(j), stars }];
    });
  };

  function toDataUrl(name: string, text: string) {
    const b64 = typeof window !== "undefined" ? window.btoa(unescape(encodeURIComponent(text))) : Buffer.from(text, "utf8").toString("base64");
    return `data:text/plain;charset=utf-8;name=${encodeURIComponent(name)};base64,${b64}`;
  }

  const generate = async (j: Job) => {
    const res = await fetch(`${API_BASE}/generate/application`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: j.id }),
    });
    const data = await res.json();
    const cvUrl = toDataUrl(`${j.title}-CV.txt`, data.cv);
    const clUrl = toDataUrl(`${j.title}-CoverLetter.txt`, data.cl);
    await api.post("/me/applications", { jobKey: jobKey(j), generatedDocs: { cvUrl, clUrl } });
    alert("Generated CV and Cover Letter added to Applications.");
  };

  React.useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/me/ratings");
        setRatings(r || []);
      } catch {}
      rankedFetch();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main>
      <h1>Dashboard</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search query" />
        <button onClick={rankedFetch} disabled={loading}>Search</button>
        <button onClick={ingestAndFetch} disabled={loading}>Fetch Jobs</button>
      </div>

      {loading && <p>Loading…</p>}

      <div style={{ display: "grid", gap: 16 }}>
        {jobs.map((j) => {
          const r = ratings.find((x) => x.jobKey === jobKey(j));
          const selected = r?.stars ?? 0;
          return (
            <article key={jobKey(j)} style={{ border: "1px solid #333", borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{j.title}</h3>
                  <div style={{ opacity: 0.8 }}>{j.company} • {j.location}</div>
                </div>
                <a href={j.url} target="_blank" rel="noreferrer">View</a>
              </div>
              <p style={{ marginTop: 8, opacity: 0.9 }}>
                {j.description?.slice(0, 240)}{j.description && j.description.length > 240 ? "…" : ""}
              </p>
              <div>
                {[1,2,3,4,5].map((s) => (
                  <button
                    key={s}
                    onClick={() => rate(j, s)}
                    style={{
                      marginRight: 6,
                      padding: "4px 8px",
                      background: s <= selected ? "#ffd166" : "#222",
                      color: s <= selected ? "#000" : "#fff",
                      border: "1px solid #444",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    {s}★
                  </button>
                ))}
                { (ratings.find((x) => x.jobKey === jobKey(j))?.stars ?? 0) >= 4 && (
                  <button onClick={() => generate(j)} style={{ marginLeft: 8, padding: "4px 10px" }}>Generate Application</button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
