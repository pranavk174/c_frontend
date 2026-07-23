"use client";
import { Provider } from "react-redux";

import { PersistGate } from "redux-persist/integration/react";

import { store, persistor } from "./store";
import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "@/lib/utils";


export default function Wrapper({ children }: { children: React.ReactNode }) {
  //   const [isOnline, setIsOnline] = useState(true);
  const onLineRef = useRef(false);
  const cleanOldServiceWorker = async () => {
    await navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => {
        reg.unregister().then((boolean) => {
          if (boolean) {
            logger.log("older service worker removed succesfully");
          } else {
            logger.log("falied to remove service workey");
          }
        });
      });
    });
  };

  const registerNewServiceWorker = async () => {
    await navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        logger.log("New Service Worker Registered:", registration);
      })
      .catch((error) => {
        logger.log("Service Worker Registration Failed:", error);
      });
  };

  useEffect(() => {
    if (!navigator.onLine) {
      window.location.href = "/offline.html";
    }
    if (onLineRef.current === null) onLineRef.current = navigator.onLine;
    // setIsOnline(navigator.onLine);
    // Add event listeners for online/offline events
    const handleOnline = () => (onLineRef.current = true);
    const handleOffline = () => (onLineRef.current = false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if ("serviceWorker" in navigator) {
      // Clean up old service workers
      // cleanOldServiceWorker();
      // Register the new service worker
      // registerNewServiceWorker();
      // Ensure the service worker is ready
    }
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const value = document.cookie.includes("dark") ? "dark" : "light";

    document.cookie = `theme=${value}; path=/; SameSite=Lax`;
    document.documentElement.classList.toggle("dark", value === "dark");
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
