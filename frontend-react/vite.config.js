import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Fishlo Delivery",
        short_name: "Delivery",
        description: "Fishlo Delivery Partner Application",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/delivery/login",
        scope: "/delivery/",
        icons: [
          {
            src: "fishlo-logo-coral.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "fishlo-logo-coral.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
        ],
      },
    }),
  ],
  server: {
    allowedHosts: true, // or your specific ngrok url
    // strictPort: true,
    // hmr: {
    //   clientPort: 443, // Forces Hot Module Replacement to use the secure ngrok port
    // },
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Core React Dependencies
            if (
              id.includes("/node_modules/react/") ||
              id.includes("/node_modules/react-dom/") ||
              id.includes("/node_modules/react-router-dom/") ||
              id.includes("/node_modules/react-router/")
            ) {
              return "react-core";
            }
            // Data Fetching
            if (id.includes("/node_modules/@tanstack/") || id.includes("/node_modules/axios/")) {
              return "data-fetching";
            }
            // Heavy UI & Utility Libraries
            if (id.includes("/node_modules/swiper/")) {
              return "vendor-swiper";
            }
            if (id.includes("/node_modules/qz-tray/")) {
              return "vendor-qz-tray";
            }
            if (id.includes("/node_modules/react-ga4/")) {
              return "react-ga4";
            }
            // Let Vite handle the rest automatically
          }
        },
      },
    },
  },
});
