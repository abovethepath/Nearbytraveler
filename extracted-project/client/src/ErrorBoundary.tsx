// client/src/ErrorBoundary.tsx
import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  e: any;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { e: null };
  
  static getDerivedStateFromError(e: any): ErrorBoundaryState { 
    return { e }; 
  }
  
  render(): React.ReactNode { 
    return this.state.e
      ? <pre style={{whiteSpace:"pre-wrap",padding:16,color:"crimson"}}>{String(this.state.e?.stack||this.state.e)}</pre>
      : this.props.children; 
  }
}