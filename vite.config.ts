import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

/** Phone installs should not contain the website APK files. */
function stripDownloadApks(mode: string): Plugin {
  return {
    name: "strip-download-apks",
    apply: "build",
    closeBundle() {
      if (mode !== "capacitor") return;
      const dir = path.resolve(__dirname, "dist/downloads");
      if (!fs.existsSync(dir)) return;
      for (const name of fs.readdirSync(dir)) {
        if (name.endsWith(".apk")) fs.unlinkSync(path.join(dir, name));
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Absolute base on Vercel so PWA/asset URLs stay /assets/...
  // Relative base only for Capacitor (`vite build --mode capacitor`).
  base: mode === "capacitor" ? "./" : "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), stripDownloadApks(mode), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-recharts": ["recharts"],
        },
      },
    },
  },
}));
