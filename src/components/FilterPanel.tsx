// Copyright (c) 2026 jinming1345
// Licensed under AGPL-3.0. See LICENSE file for details.
// https://github.com/jinming1345/LogLens

import { ExportDialog } from "@/components/ExportDialog";
import type { ExportLine } from "@/lib/tauri-api";
import { useFilterStore } from "@/stores/useFilterStore";
import { useLogStore } from "@/stores/useLogStore";
import { cn } from "@/lib/utils";
import { Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type FilterPanelProps = {
  focusNonce: number;
};

export function FilterPanel({ focusNonce }: FilterPanelProps) {
  const { t } = useTranslation();
  const primaryRef = useRef<HTMLInputElement>(null);

  const files = useLogStore((s) => s.files);
  const lines = useLogStore((s) => s.lines);
  const activeFile = useLogStore((s) => {
    const id = s.activeFileId;
    return s.files.find((f) => f.id === id) ?? null;
  });

  const keywords = useFilterStore((s) => s.keywords);
  const addKeyword = useFilterStore((s) => s.addKeyword);
  const removeKeyword = useFilterStore((s) => s.removeKeyword);
  const updateKeyword = useFilterStore((s) => s.updateKeyword);
  const timeRange = useFilterStore((s) => s.timeRange);
  const setTimeRange = useFilterStore((s) => s.setTimeRange);
  const levels = useFilterStore((s) => s.levels);
  const toggleLevel = useFilterStore((s) => s.toggleLevel);
  const customFields = useFilterStore((s) => s.customFields);
  const addCustomField = useFilterStore((s) => s.addCustomField);
  const removeCustomField = useFilterStore((s) => s.removeCustomField);
  const updateCustomField = useFilterStore((s) => s.updateCustomField);
  const useRegex = useFilterStore((s) => s.useRegex);
  const setUseRegex = useFilterStore((s) => s.setUseRegex);
  const caseSensitive = useFilterStore((s) => s.caseSensitive);
  const setCaseSensitive = useFilterStore((s) => s.setCaseSensitive);
  const logic = useFilterStore((s) => s.logic);
  const setLogic = useFilterStore((s) => s.setLogic);
  const results = useFilterStore((s) => s.results);
  const isSearching = useFilterStore((s) => s.isSearching);
  const applyFilter = useFilterStore((s) => s.applyFilter);
  const clearFilter = useFilterStore((s) => s.clearFilter);
  const savedFilters = useFilterStore((s) => s.savedFilters);
  const saveFilter = useFilterStore((s) => s.saveFilter);
  const loadFilter = useFilterStore((s) => s.loadFilter);
  const deleteFilter = useFilterStore((s) => s.deleteFilter);

  const fileIds = useMemo(() => files.map((f) => f.id), [files]);

  const [presetName, setPresetName] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    if (focusNonce > 0) primaryRef.current?.focus();
  }, [focusNonce]);

  const levelIds = ["debug", "info", "warn", "error", "fatal"] as const;

  const levelLabel = (id: (typeof levelIds)[number]) => {
    switch (id) {
      case "debug":
        return t("filter.levelDebug");
      case "info":
        return t("filter.levelInfo");
      case "warn":
        return t("filter.levelWarn");
      case "error":
        return t("filter.levelError");
      case "fatal":
        return t("filter.levelFatal");
      default:
        return id;
    }
  };

  const buildExportFromSearch = (): ExportLine[] => {
    if (!results?.matches.length) return [];
    return results.matches.map((m) => ({
      line_number: m.line_number,
      content: m.content.raw || m.content.message,
      level: m.content.level ?? "",
      timestamp: m.content.timestamp ?? "",
      file_name: m.file_name,
    }));
  };

  const buildExportFromVisible = (): ExportLine[] => {
    if (!activeFile) return [];
    return lines.map((l) => ({
      line_number: l.line_number,
      content: l.raw,
      level: l.level ?? "",
      timestamp: l.timestamp ?? "",
      file_name: activeFile.name,
    }));
  };

  const exportLabel = results?.matches.length
    ? t("export.sourceSearch")
    : t("export.sourceVisible");

  const handleApply = async () => {
    await applyFilter(fileIds);
  };

  return (
    <aside className="flex h-full w-full flex-col bg-card/50">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Search className="h-4 w-4" />
          {t("filter.title")}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3 scrollbar-thin">
        <section className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("filter.keywords")}
          </div>
          {keywords.map((k, i) => (
            <div key={i} className="flex gap-1">
              <input
                ref={i === 0 ? primaryRef : undefined}
                id={i === 0 ? "loglens-filter-primary" : undefined}
                className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none ring-primary/30 focus:ring-2"
                placeholder={t("filter.keywordPlaceholder")}
                value={k.text}
                onChange={(e) =>
                  updateKeyword(i, { text: e.target.value })
                }
              />
              <label className="flex items-center gap-1 whitespace-nowrap text-[11px] text-muted-foreground">
                <input
                  type="checkbox"
                  checked={k.is_regex}
                  onChange={(e) =>
                    updateKeyword(i, { is_regex: e.target.checked })
                  }
                />
                {t("filter.regexPerKeyword")}
              </label>
              <button
                type="button"
                title={t("filter.removeKeyword")}
                onClick={() => removeKeyword(i)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addKeyword}
            className="text-xs text-primary hover:underline"
          >
            {t("filter.addKeyword")}
          </button>
        </section>

        <section className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("filter.timeRange")}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              className="rounded-md border border-border bg-background px-2 py-1 text-xs"
              placeholder={t("filter.start")}
              value={timeRange?.start ?? ""}
              onChange={(e) =>
                setTimeRange({
                  start: e.target.value || null,
                  end: timeRange?.end ?? null,
                })
              }
            />
            <input
              className="rounded-md border border-border bg-background px-2 py-1 text-xs"
              placeholder={t("filter.end")}
              value={timeRange?.end ?? ""}
              onChange={(e) =>
                setTimeRange({
                  start: timeRange?.start ?? null,
                  end: e.target.value || null,
                })
              }
            />
          </div>
          <button
            type="button"
            onClick={() => setTimeRange(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t("filter.clearTime")}
          </button>
        </section>

        <section className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("filter.levels")}
          </div>
          <div className="flex flex-wrap gap-2">
            {levelIds.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleLevel(id)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs capitalize",
                  levels.includes(id)
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted",
                )}
              >
                {levelLabel(id)}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("filter.customFields")}
          </div>
          {customFields.map((f, i) => (
            <div key={i} className="flex gap-1">
              <input
                className="w-1/3 rounded-md border border-border bg-background px-2 py-1 text-xs"
                placeholder={t("filter.fieldName")}
                value={f.field}
                onChange={(e) =>
                  updateCustomField(i, { field: e.target.value })
                }
              />
              <input
                className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
                placeholder={t("filter.fieldValue")}
                value={f.value}
                onChange={(e) =>
                  updateCustomField(i, { value: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => removeCustomField(i)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addCustomField}
            className="text-xs text-primary hover:underline"
          >
            {t("filter.addField")}
          </button>
        </section>

        <section className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("filter.options")}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useRegex}
              onChange={(e) => setUseRegex(e.target.checked)}
            />
            {t("filter.useRegex")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
            />
            {t("filter.caseSensitive")}
          </label>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              className={cn(
                "flex-1 rounded-md border px-2 py-1 text-xs",
                logic === "AND" ? "border-primary bg-primary/10" : "border-border",
              )}
              onClick={() => setLogic("AND")}
            >
              {t("filter.logicAnd")}
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 rounded-md border px-2 py-1 text-xs",
                logic === "OR" ? "border-primary bg-primary/10" : "border-border",
              )}
              onClick={() => setLogic("OR")}
            >
              {t("filter.logicOr")}
            </button>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleApply()}
            disabled={isSearching || !fileIds.length}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            {isSearching ? t("filter.searching") : t("filter.apply")}
          </button>
          <button
            type="button"
            onClick={() => clearFilter()}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            {t("filter.clear")}
          </button>
        </div>

        <section className="space-y-2 border-t border-border pt-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("filter.savedFilters")}
          </div>
          <div className="flex gap-1">
            <input
              className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
              placeholder={t("filter.saveNamePlaceholder")}
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
            />
            <button
              type="button"
              className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
              onClick={() => {
                saveFilter(presetName);
                setPresetName("");
              }}
            >
              {t("filter.saveAs")}
            </button>
          </div>
          <div className="space-y-1">
            {savedFilters.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between rounded-md border border-border px-2 py-1 text-xs"
              >
                <button
                  type="button"
                  className="truncate text-left hover:underline"
                  onClick={() => loadFilter(p.name)}
                >
                  {p.name}
                </button>
                <button
                  type="button"
                  title={t("filter.deleteFilter")}
                  onClick={() => deleteFilter(p.name)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2 border-t border-border pt-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("filter.exportSection")}
          </div>
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="w-full rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            {t("filter.openExport")}
          </button>
        </section>

        {results ? (
          <section className="space-y-2 border-t border-border pt-3">
            <div className="text-sm font-medium">
              {t("search.results", { count: results.total_matches })}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("search.time", { ms: results.search_time_ms })}
            </div>
            {results.matches.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("search.viewInMain") ?? "结果已显示在左侧主区域"}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{t("search.noResults")}</p>
            )}
          </section>
        ) : null}
      </div>

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        defaultSourceLabel={exportLabel}
        buildLines={() => {
          const fromSearch = buildExportFromSearch();
          if (fromSearch.length) return fromSearch;
          return buildExportFromVisible();
        }}
      />
    </aside>
  );
}
