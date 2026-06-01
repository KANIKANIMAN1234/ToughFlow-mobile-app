"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type DisplayMode = "phone" | "tablet";

const STORAGE_KEY = "toughflow-display-mode";

function readInitialMode(): DisplayMode {
  if (typeof window === "undefined") return "phone";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "phone" || saved === "tablet") return saved;
  return window.innerWidth >= 768 ? "tablet" : "phone";
}

type DisplayModeContextValue = {
  mode: DisplayMode;
  isTablet: boolean;
  setMode: (mode: DisplayMode) => void;
  toggleMode: () => void;
};

const DisplayModeContext = createContext<DisplayModeContextValue | null>(null);

export function DisplayModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DisplayMode>("phone");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setModeState(readInitialMode());
    setReady(true);
  }, []);

  const setMode = useCallback((next: DisplayMode) => {
    setModeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((current) => {
      const next: DisplayMode = current === "phone" ? "tablet" : "phone";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-surface" />;
  }

  return (
    <DisplayModeContext.Provider
      value={{
        mode,
        isTablet: mode === "tablet",
        setMode,
        toggleMode,
      }}
    >
      {children}
    </DisplayModeContext.Provider>
  );
}

export function useDisplayMode() {
  const ctx = useContext(DisplayModeContext);
  if (!ctx) {
    throw new Error("useDisplayMode must be used within DisplayModeProvider");
  }
  return ctx;
}
