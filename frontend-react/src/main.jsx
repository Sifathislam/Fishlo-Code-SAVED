import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import ReactGA from "react-ga4";

// Initialize Google Analytics with placeholder. Update with actual ID later.
ReactGA.initialize("G-EF2121FJCK");

// PWA Service Worker Registration
import { registerSW } from "virtual:pwa-register";
if (window.location.pathname.startsWith("/delivery")) {
  registerSW({ immediate: true });
}

import AuthProvider from "./providers/AuthProvider.jsx";
import StateProvider from "./providers/StateProvider.jsx";
import QZProvider from "./providers/QZProvider.jsx";
const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <StateProvider>
            <QZProvider>
              <App />
            </QZProvider>
          </StateProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  </StrictMode>
);
