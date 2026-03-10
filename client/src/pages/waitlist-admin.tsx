import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/queryClient";

interface WaitlistLead {
  id: number;
  name: string;
  email: string;
  submittedAt: string;
  contacted: boolean;
  notes: string | null;
}

export default function WaitlistAdmin() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "email">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data, isLoading, error } = useQuery<{ count: number; leads: WaitlistLead[] }>({
    queryKey: ["/api/waitlist"],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/waitlist`);
      if (!res.ok) throw new Error("Failed to load waitlist");
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  const filtered = (data?.leads ?? [])
    .filter((l) => {
      const q = search.toLowerCase();
      return l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date") cmp = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      if (sortBy === "email") cmp = a.email.localeCompare(b.email);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const toggleSort = (col: "date" | "name" | "email") => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("asc"); }
  };

  const exportCsv = () => {
    const rows = [
      ["ID", "Name", "Email", "Submitted At", "Contacted"],
      ...filtered.map((l) => [
        l.id,
        l.name,
        l.email,
        new Date(l.submittedAt).toLocaleString(),
        l.contacted ? "Yes" : "No",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const arrow = (col: "date" | "name" | "email") =>
    sortBy === col ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f1f5f9", padding: "24px 16px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Waitlist</h1>
          {data && (
            <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 15 }}>
              <strong style={{ color: "#f97316", fontSize: 22 }}>{data.count}</strong> total signups
              {search && filtered.length !== data.count && (
                <span> · <strong style={{ color: "#60a5fa" }}>{filtered.length}</strong> matching</span>
              )}
            </p>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 8,
              border: "1px solid #334155", background: "#1e293b", color: "#f1f5f9",
              fontSize: 14, outline: "none",
            }}
          />
          <button
            onClick={exportCsv}
            style={{
              padding: "10px 20px", borderRadius: 8, border: "none",
              background: "#f97316", color: "#fff", fontWeight: 700,
              fontSize: 14, cursor: "pointer",
            }}
          >
            Export CSV
          </button>
        </div>

        {/* Table */}
        {isLoading && (
          <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>Loading…</div>
        )}
        {error && (
          <div style={{ textAlign: "center", padding: 60, color: "#f87171" }}>
            Failed to load waitlist data.
          </div>
        )}
        {!isLoading && !error && (
          <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #1e293b" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#1e293b", textAlign: "left" }}>
                  <th style={th} onClick={() => toggleSort("name")} title="Sort by name">
                    Name{arrow("name")}
                  </th>
                  <th style={th} onClick={() => toggleSort("email")} title="Sort by email">
                    Email{arrow("email")}
                  </th>
                  <th style={th} onClick={() => toggleSort("date")} title="Sort by date">
                    Signed Up{arrow("date")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
                      No results found
                    </td>
                  </tr>
                )}
                {filtered.map((lead, i) => (
                  <tr
                    key={lead.id}
                    style={{ background: i % 2 === 0 ? "#0f172a" : "#1e293b" }}
                  >
                    <td style={td}>{lead.name}</td>
                    <td style={{ ...td, color: "#60a5fa" }}>
                      <a href={`mailto:${lead.email}`} style={{ color: "#60a5fa", textDecoration: "none" }}>
                        {lead.email}
                      </a>
                    </td>
                    <td style={{ ...td, color: "#94a3b8", whiteSpace: "nowrap" }}>
                      {new Date(lead.submittedAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ marginTop: 20, fontSize: 12, color: "#475569", textAlign: "center" }}>
          Showing {filtered.length} of {data?.count ?? 0} entries
        </p>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "12px 16px", color: "#94a3b8", fontWeight: 600,
  fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em",
  cursor: "pointer", userSelect: "none", borderBottom: "1px solid #334155",
};

const td: React.CSSProperties = {
  padding: "12px 16px", borderBottom: "1px solid #1e293b",
};
