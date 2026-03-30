import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/queryClient";

interface WaitlistLead {
  id: number;
  name: string;
  email: string;
  submittedAt: string;
  contacted: boolean;
  notes: string | null;
  invitedAt: string | null;
}

export default function WaitlistAdmin() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "email">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filter, setFilter] = useState<"all" | "not_invited" | "invited">("all");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ count: number; leads: WaitlistLead[] }>({
    queryKey: ["/api/waitlist"],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/waitlist`);
      if (!res.ok) throw new Error("Failed to load waitlist");
      return res.json();
    },
    staleTime: 30 * 1000,
  });

  const inviteOne = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/waitlist/invite-one/${id}`, {
        method: "POST", credentials: "include", headers: { "x-user-id": "2" },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/waitlist"] }),
  });

  const inviteAll = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/waitlist/invite-all`, {
        method: "POST", credentials: "include", headers: { "x-user-id": "2" },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/waitlist"] });
      alert(`Done! ${data.invited} invited, ${data.alreadySignedUp} already signed up, ${data.failed} failed`);
    },
  });

  const leads = data?.leads ?? [];
  const invitedCount = leads.filter(l => l.invitedAt).length;
  const notInvitedCount = leads.filter(l => !l.invitedAt).length;

  const filtered = leads
    .filter(l => {
      if (filter === "invited") return !!l.invitedAt;
      if (filter === "not_invited") return !l.invitedAt;
      return true;
    })
    .filter(l => {
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
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };
  const arrow = (col: "date" | "name" | "email") =>
    sortBy === col ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  const exportCsv = () => {
    const rows = [
      ["ID", "Name", "Email", "Submitted At", "Invited At"],
      ...filtered.map(l => [l.id, l.name, l.email, new Date(l.submittedAt).toLocaleString(), l.invitedAt ? new Date(l.invitedAt).toLocaleString() : "Not invited"]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `waitlist_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f1f5f9", padding: "24px 16px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Waitlist</h1>
          {data && (
            <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 15 }}>
              <strong style={{ color: "#f97316", fontSize: 22 }}>{data.count}</strong> total
              {" · "}
              <strong style={{ color: "#22c55e" }}>{invitedCount}</strong> invited
              {" · "}
              <strong style={{ color: "#eab308" }}>{notInvitedCount}</strong> waiting
            </p>
          )}
        </div>

        {/* Action bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={() => { if (confirm(`Send invite emails to ${notInvitedCount} leads?`)) inviteAll.mutate(); }}
            disabled={inviteAll.isPending || notInvitedCount === 0}
            style={{ padding: "8px 16px", background: "#f97316", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 14, opacity: inviteAll.isPending ? 0.5 : 1 }}
          >
            {inviteAll.isPending ? "Sending..." : `📧 Invite All (${notInvitedCount})`}
          </button>
          <button onClick={exportCsv} style={{ padding: "8px 16px", background: "#334155", color: "#94a3b8", border: "1px solid #475569", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>
            Export CSV
          </button>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name or email..."
            style={{ flex: 1, minWidth: 180, padding: "8px 12px", background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155", borderRadius: 6, fontSize: 14, outline: "none" }}
          />
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {(["all", "not_invited", "invited"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: filter === f ? "#f97316" : "#1e293b", color: filter === f ? "#fff" : "#94a3b8" }}>
              {f === "all" ? "All" : f === "not_invited" ? "Not Invited" : "Invited"}
            </button>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>Loading...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155" }}>
                  <th style={{ padding: "10px 8px", textAlign: "left", color: "#94a3b8", cursor: "pointer" }} onClick={() => toggleSort("name")}>Name{arrow("name")}</th>
                  <th style={{ padding: "10px 8px", textAlign: "left", color: "#94a3b8", cursor: "pointer" }} onClick={() => toggleSort("email")}>Email{arrow("email")}</th>
                  <th style={{ padding: "10px 8px", textAlign: "left", color: "#94a3b8", cursor: "pointer" }} onClick={() => toggleSort("date")}>Signed Up{arrow("date")}</th>
                  <th style={{ padding: "10px 8px", textAlign: "left", color: "#94a3b8" }}>Status</th>
                  <th style={{ padding: "10px 8px", textAlign: "right", color: "#94a3b8" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} style={{ borderBottom: "1px solid #1e293b" }}>
                    <td style={{ padding: "10px 8px", fontWeight: 500 }}>{l.name}</td>
                    <td style={{ padding: "10px 8px", color: "#94a3b8" }}>{l.email}</td>
                    <td style={{ padding: "10px 8px", color: "#64748b", fontSize: 13 }}>{new Date(l.submittedAt).toLocaleDateString()}</td>
                    <td style={{ padding: "10px 8px" }}>
                      {l.invitedAt ? (
                        <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>✓ Invited {new Date(l.invitedAt).toLocaleDateString()}</span>
                      ) : (
                        <span style={{ color: "#eab308", fontSize: 12 }}>Waiting</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right" }}>
                      {!l.invitedAt && (
                        <button
                          onClick={() => inviteOne.mutate(l.id)}
                          disabled={inviteOne.isPending}
                          style={{ padding: "4px 10px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                        >
                          Send Invite
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p style={{ color: "#64748b", textAlign: "center", padding: 20 }}>No leads found</p>}
          </div>
        )}
      </div>
    </div>
  );
}
