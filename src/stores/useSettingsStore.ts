// Copyright (c) 2026 jinming1345
// Licensed under AGPL-3.0. See LICENSE file for details.
// https://github.com/jinming1345/LogLens

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AppTheme = "light" | "dark" | "system";
export type AppLanguage = "zh" | "en";

export function applyDocumentTheme(theme: AppTheme): void {
  const root = document.documentElement;
  let dark = false;
  if (theme === "dark") dark = true;
  else if (theme === "light") dark = false;
  else
    dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.classList.toggle("dark", dark);
}

export interface SettingsStoreState {
  theme: AppTheme;
  language: AppLanguage;
  fontSize: number;
  showLineNumbers: boolean;
  setTheme: (theme: AppTheme) => void;
  setLanguage: (language: AppLanguage) => void;
  setFontSize: (size: number) => void;
  toggleLineNumbers: () => void;
}

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set) => ({
      theme: "system",
      language: "zh",
      fontSize: 13,
      showLineNumbers: true,

      setTheme: (theme) => {
        set({ theme });
        applyDocumentTheme(theme);
      },

      setLanguage: (language) => set({ language }),

      setFontSize: (size) => {
        const clamped = Math.min(20, Math.max(12, Math.round(size)));
        set({ fontSize: clamped });
      },

      toggleLineNumbers: () =>
        set((s) => ({ showLineNumbers: !s.showLineNumbers })),
    }),
    {
      name: "loglens-settings",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyDocumentTheme(state.theme);
      },
    },
  ),
);

export function initThemeFromStorage(): void {
  try {
    const raw = localStorage.getItem("loglens-settings");
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { theme?: AppTheme } };
      if (parsed.state?.theme) {
        applyDocumentTheme(parsed.state.theme);
        return;
      }
    }
  } catch {
    /* ignore */
  }
  applyDocumentTheme("system");
}
