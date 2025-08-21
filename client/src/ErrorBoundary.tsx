import React from "react";

type State = { hasError: boolean; error?: any };

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // Log to console and window for quick debugging
    console.error("[App Crash]", error, info);
    (window as any).__LAST_APP_ERROR__ = { error, info };
  }

  render() {
    if (this.state.hasError) {
      const msg =
        (this.state.error && (this.state.error.message || String(this.state.error))) ||
        "Unknown error";
      return (
        <div style={{
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
          padding: "1rem",
          maxWidth: 900,
          margin: "2rem auto",
          border: "1px solid #eee",
          borderRadius: 12,
          background: "#fff"
        }}>
          <h2 style={{marginTop:0}}>Something went wrong.</h2>
          <p style={{color:"#555"}}>{msg}</p>
          <pre style={{whiteSpace:"pre-wrap", background:"#f7f7f7", padding:"0.75rem", borderRadius:8, overflow:"auto"}}>
            {this.state.error?.stack || ""}
          </pre>
          <p style={{fontSize:12, color:"#999"}}>
            Open DevTools → Console for full details. The last error is also at <code>window.__LAST_APP_ERROR__</code>.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}