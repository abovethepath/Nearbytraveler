import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";

console.log("✅ CRITICAL MOBILE LAYOUT v6-20250705 - SITE-WIDE FIXES DEPLOYED");
console.log("🚀 Loading full travel platform with mobile infrastructure...");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);