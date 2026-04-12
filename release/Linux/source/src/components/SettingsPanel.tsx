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
    </div>
  );
}
