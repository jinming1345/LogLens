// Copyright (c) 2026 jinming1345
// Licensed under AGPL-3.0. See LICENSE file for details.
// https://github.com/jinming1345/LogLens

import { cn } from "@/lib/utils";
import { useBookmarkStore } from "@/stores/useBookmarkStore";
import {
  applyDocumentTheme,
  useSettingsStore,
  type AppLanguage,
  type AppTheme,
} from "@/stores/useSettingsStore";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function SettingsPanel() {
  const { t } = useTranslation();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const setFontSize = useSettingsStore((s) => s.setFontSize);
  const showLineNumbers = useSettingsStore((s) => s.showLineNumbers);
  const toggleLineNumbers = useSettingsStore((s) => s.toggleLineNumbers);
  const clearBookmarks = useBookmarkStore((s) => s.clearBookmarks);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyDocumentTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const themeBtn = (value: AppTheme, label: string) => (
    <button
      type="button"
      onClick={() => setTheme(value)}
      className={cn(
        "rounded-md border px-3 py-1.5 text-sm",
        theme === value
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-background hover:bg-muted",
      )}
    >
      {label}
    </button>
  );

  const langBtn = (value: AppLanguage, label: string) => (
    <button
      type="button"
      onClick={() => setLanguage(value)}
      className={cn(
        "rounded-md border px-3 py-1.5 text-sm",
        language === value
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-background hover:bg-muted",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="h-full overflow-y-auto p-4 scrollbar-thin">
      <h2 className="text-lg font-semibold">{t("settings.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("app.description")}</p>

      <section className="mt-8 space-y-3">
        <h3 className="text-sm font-medium">{t("settings.appearance")}</h3>
        <p className="text-xs text-muted-foreground">{t("settings.themeHint")}</p>
        <div className="flex flex-wrap gap-2">
          {themeBtn("light", t("settings.themeLight"))}
          {themeBtn("dark", t("settings.themeDark"))}
          {themeBtn("system", t("settings.themeSystem"))}
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h3 className="text-sm font-medium">{t("settings.language")}</h3>
        <p className="text-xs text-muted-foreground">{t("settings.languageHint")}</p>
        <div className="flex flex-wrap gap-2">
          {langBtn("zh", t("settings.languageZh"))}
          {langBtn("en", t("settings.languageEn"))}
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h3 className="text-sm font-medium">{t("settings.viewer")}</h3>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-muted-foreground" htmlFor="fontSize">
              {t("settings.fontSize")}
            </label>
            <p className="text-[11px] text-muted-foreground">
              {t("settings.fontSizeHint")}
            </p>
            <input
              id="fontSize"
              type="range"
              min={12}
              max={20}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="mt-2 w-full max-w-sm"
            />
            <div className="text-xs tabular-nums text-muted-foreground">
              {fontSize}px
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showLineNumbers}
              onChange={toggleLineNumbers}
            />
            <span>{t("settings.lineNumbers")}</span>
          </label>
          <p className="text-[11px] text-muted-foreground">
            {t("settings.lineNumbersHint")}
          </p>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h3 className="text-sm font-medium">{t("settings.data")}</h3>
        <p className="text-xs text-muted-foreground">
          {t("settings.clearBookmarksHint")}
        </p>
        <button
          type="button"
          onClick={() => clearBookmarks()}
          className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
        >
          {t("settings.clearBookmarks")}
        </button>
      </section>

      <section className="mt-8 space-y-2">
        <h3 className="text-sm font-medium">{t("settings.shortcuts")}</h3>
        <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
          <li>Ctrl+O — {t("settings.shortcutOpen")}</li>
          <li>Ctrl+Shift+O — {t("settings.shortcutOpenFolder")}</li>
          <li>Ctrl+K — {t("settings.shortcutFilter")}</li>
          <li>Ctrl+F — {t("settings.shortcutSearch")}</li>
          <li>Ctrl+, — {t("settings.shortcutSettings")}</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3 border-t border-border pt-6">
        <h3 className="text-sm font-medium">{t("about.title")}</h3>
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary">
              LL
            </div>
            <div>
              <div className="text-base font-semibold">LogLens</div>
              <div className="text-xs text-muted-foreground">Log View Pro Max</div>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>{t("about.version")}</span>
              <span className="font-mono">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>{t("about.author")}</span>
              <span>jinming1345</span>
            </div>
            <div className="flex justify-between">
              <span>{t("about.license")}</span>
              <span>AGPL-3.0</span>
            </div>
            <div className="flex justify-between">
              <span>{t("about.techStack")}</span>
              <span>Tauri 2 + React 19 + Rust</span>
            </div>
          </div>

          <div className="mt-4 rounded-md bg-muted/50 p-3 text-[11px] text-muted-foreground">
            <p>Copyright &copy; 2026 jinming1345. All rights reserved.</p>
            <p className="mt-1">{t("about.licenseNote")}</p>
          </div>

          <div className="mt-3 flex gap-2">
            <a
              href="https://github.com/jinming1345/LogLens"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
            >
              GitHub
            </a>
            <a
              href="https://github.com/jinming1345/LogLens/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
            >
              {t("about.releases")}
            </a>
            <a
              href="https://github.com/jinming1345/LogLens/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
            >
              {t("about.reportIssue")}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
