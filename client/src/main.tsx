import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// import "./index.css";  // Temporarily disabled to fix build
import ErrorBoundary from "./ErrorBoundary";

console.log("BOOT OK - Emergency mode loading");

const rootEl =
  document.getElementById("root") ||
  (() => {
    const el = document.createElement("div");
    el.id = "root";
    document.body.appendChild(el);
    return el;
  })();

ReactDOM.createRoot(rootEl).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);