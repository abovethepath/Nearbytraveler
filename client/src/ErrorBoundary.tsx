import React from "react";
export default class ErrorBoundary extends React.Component<{}, {e:any}> {
  state = { e: null };
  static getDerivedStateFromError(e:any){ return { e }; }
  render(){ return this.state.e
    ? <pre style={{whiteSpace:"pre-wrap",padding:16,color:"crimson"}}>{String(this.state.e?.stack||this.state.e)}</pre>
    : this.props.children as any; }
}