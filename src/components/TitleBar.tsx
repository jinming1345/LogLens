// Copyright (c) 2026 jinming1345
// Licensed under AGPL-3.0. See LICENSE file for details.
// https://github.com/jinming1345/LogLens

import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Filter, Moon, Sun, Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";

type TitleBarProps = {
  onToggleFilter: () => void;
  filterOpen: boolean;
};

export function TitleBar({ onToggleFilter, filterOpen }: TitleBarProps) {
  const { t } = useTranslation();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const cycleTheme = () => {
    const order: Array<"light" | "dark" | "system"> = [
      "light",
      "dark",
      "system",
    ];
    const idx = order.indexOf(theme);
    const next = order[(idx + 1) % order.length];
    setTheme(next);
  };

  const ThemeIcon =
    theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <header
      className={cn(
        "flex h-10 shrink-0 items-center border-b border-border bg-card/80 backdrop-blur",
        "px-3",
      )}
      data-tauri-drag-region
    >
      <div
        className="flex min-w-0 flex-1 items-center gap-2"
        data-tauri-drag-region
      >
        <span className="truncate text-sm font-semibold text-foreground">
          {t("app.title")}
        </span>
        <span className="truncate text-[11px] text-muted-foreground">
          {t("app.subtitle")}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          title={t("titleBar.toggleFilter")}
          onClick={onToggleFilter}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent",
            "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            filterOpen && "border-border bg-accent text-accent-foreground",
          )}
        >
          <Filter className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title={t("titleBar.toggleTheme")}
          onClick={cycleTheme}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <ThemeIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
