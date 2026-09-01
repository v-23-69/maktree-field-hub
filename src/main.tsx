import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { initMobilePortraitLock } from "@/lib/mobileOrientation";
import { initNativeShell, isNativeApp } from "@/lib/capacitor";

initMobilePortraitLock();
if (isNativeApp()) {
  document.documentElement.classList.add("cap-native");
}
void initNativeShell();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);

// PWA service worker — web only (Capacitor uses native shell instead)
if (!isNativeApp() && "serviceWorker" in navigator) {
  const register = () => {
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((err) => console.error("[PWA] Service worker registration failed:", err));
  };
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}
