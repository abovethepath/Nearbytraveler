import React from "react";

// Find every TSX/JSX in /pages
const modules = import.meta.glob("./pages/**/*.{tsx,jsx}");

function pretty(name: string) {
  return name
    .replace(/^\.\/pages\//, "/")
    .replace(/\.(tsx|jsx)$/, "")
    .replace(/index$/i, "");
}

export default function DevPageExplorer() {
  const [current, setCurrent] = React.useState<string>("");
  const [Comp, setComp] = React.useState<React.ComponentType | null>(null);

  const entries = Object.keys(modules).sort().map((k) => ({ key: k, route: pretty(k) }));

  async function load(key: string) {
    setCurrent(key);
    const mod: any = await (modules as any)[key]();
    setComp(() => (mod?.default ? mod.default : () => <div>No default export</div>));
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto" }}>
      <h2 style={{ marginTop: 0 }}>🧭 Dev Page Explorer</h2>
      <p style={{ color: "#666" }}>
        Click a page to render it. This lists everything under <code>client/src/pages/</code>.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        <div style={{ borderRight: "1px solid #eee", paddingRight: 12, maxHeight: "70vh", overflow: "auto" }}>
          {entries.length === 0 && <div>No pages found in /pages.</div>}
          {entries.map(({ key, route }) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <button
                onClick={() => load(key)}
                style={{
                  width: "100%", textAlign: "left", padding: "8px 10px",
                  borderRadius: 8, border: "1px solid #ddd", background: current === key ? "#f2f6ff" : "#fff"
                }}
              >
                {route}
              </button>
            </div>
          ))}
        </div>

        <div style={{ minHeight: 200 }}>
          {Comp ? <Comp /> : <div style={{ color: "#999" }}>Select a page on the left to render it here.</div>}
        </div>
      </div>
    </div>
  );
}