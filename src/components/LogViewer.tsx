// Copyright (c) 2026 jinming1345
// Licensed under AGPL-3.0. See LICENSE file for details.
// https://github.com/jinming1345/LogLens

import { cn } from "@/lib/utils";
import { highlightText } from "@/lib/highlight";
import { startTail, stopTail } from "@/lib/tauri-api";
import { useBookmarkStore } from "@/stores/useBookmarkStore";
import { useFilterStore } from "@/stores/useFilterStore";
import { useLogStore } from "@/stores/useLogStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowDown,
  ArrowUp,
  BookmarkPlus,
  Copy,
  Radio,
  Square,
} from "lucide-react";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

function levelTextClass(level: string | null): string {
  const l = (level || "").toLowerCase();
  if (l.includes("fatal")) return "text-log-fatal";
  if (l.includes("error")) return "text-log-error";
  if (l.includes("warn")) return "text-log-warn";
  if (l.includes("info")) return "text-log-info";
  if (l.includes("debug")) return "text-log-debug";
  return "text-foreground";
}

export function LogViewer() {
  const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement>(null);

  const files = useLogStore((s) => s.files);
  const activeFileId = useLogStore((s) => s.activeFileId);
  const lines = useLogStore((s) => s.lines);
  const isLoading = useLogStore((s) => s.isLoading);
  const loadingProgress = useLogStore((s) => s.loadingProgress);
  const indexingStatus = useLogStore((s) => s.indexingStatus);
  const scrollToLineNumber = useLogStore((s) => s.scrollToLineNumber);
  const clearScrollTarget = useLogStore((s) => s.clearScrollTarget);

  const fontSize = useSettingsStore((s) => s.fontSize);
  const showLineNumbers = useSettingsStore((s) => s.showLineNumbers);

  const addBookmark = useBookmarkStore((s) => s.addBookmark);

  const filterKeywords = useFilterStore((s) => s.keywords);
  const filterCaseSensitive = useFilterStore((s) => s.caseSensitive);
  const hasSearchResults = useFilterStore((s) => s.results) !== null;

  const kwTexts = useMemo(
    () =>
      hasSearchResults
        ? filterKeywords.map((k) => k.text).filter((t) => t.trim().length > 0)
        : [],
    [filterKeywords, hasSearchResults],
  );

  const hl = useCallback(
    (text: string): ReactNode =>
      kwTexts.length > 0
        ? highlightText(text, kwTexts, filterCaseSensitive)
        : text,
    [kwTexts, filterCaseSensitive],
  );

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [tailing, setTailing] = useState(false);

  const activeFile = useMemo(
    () => files.find((f) => f.id === activeFileId) ?? null,
    [files, activeFileId],
  );

  const estimatedRowHeight = Math.max(28, Math.round(fontSize * 2.2));

  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 8,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  useEffect(() => {
    if (scrollToLineNumber == null || lines.length === 0) return;
    const idx = lines.findIndex((l) => l.line_number === scrollToLineNumber);
    if (idx >= 0) {
      virtualizer.scrollToIndex(idx, { align: "center" });
      setSelectedIndex(idx);
    }
    clearScrollTarget();
  }, [scrollToLineNumber, lines, virtualizer, clearScrollTarget]);

  const onCopyLine = useCallback(async () => {
    if (selectedIndex == null) return;
    const line = lines[selectedIndex];
    if (!line) return;
    await navigator.clipboard.writeText(line.raw);
  }, [lines, selectedIndex]);

  const onAddBookmark = useCallback(() => {
    if (!activeFile || selectedIndex == null) return;
    const line = lines[selectedIndex];
    if (!line) return;
    addBookmark({
      fileId: activeFile.id,
      fileName: activeFile.name,
      lineNumber: line.line_number,
      note: "",
      content: line.raw.slice(0, 4000),
    });
  }, [activeFile, addBookmark, lines, selectedIndex]);

  const toggleTail = useCallback(async () => {
    if (!activeFileId) return;
    if (tailing) {
      await stopTail(activeFileId);
      setTailing(false);
    } else {
      await startTail(activeFileId);
      setTailing(true);
    }
  }, [activeFileId, tailing]);

  useEffect(() => {
    setSelectedIndex(null);
  }, [activeFileId]);

  if (!activeFile) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("viewer.empty")}</p>
        <p className="max-w-md text-xs text-muted-foreground">
          {t("file.dragHint")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-background/60 px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{activeFile.name}</div>
          <div className="truncate text-[11px] text-muted-foreground">
            {activeFile.path}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => parentRef.current && (parentRef.current.scrollTop = 0)}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs hover:bg-muted"
            title={t("viewer.goToTop")}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              virtualizer.scrollToIndex(lines.length - 1, { align: "end" })
            }
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs hover:bg-muted"
            title={t("viewer.goToBottom")}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => void toggleTail()}
            className={cn(
              "inline-flex h-8 items-center gap-1 rounded-md border px-2 text-xs",
              tailing
                ? "border-log-info text-log-info"
                : "border-border hover:bg-muted",
            )}
            title={tailing ? t("viewer.tailStop") : t("viewer.tailStart")}
          >
            {tailing ? (
              <Square className="h-3.5 w-3.5" />
            ) : (
              <Radio className="h-3.5 w-3.5" />
            )}
            <span>{tailing ? t("viewer.tailActive") : t("viewer.tailStart")}</span>
          </button>
          <button
            type="button"
            disabled={selectedIndex == null}
            onClick={() => void onCopyLine()}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs hover:bg-muted disabled:opacity-40"
            title={t("viewer.copyRaw")}
          >
            <Copy className="h-3.5 w-3.5" />
            {t("common.copy")}
          </button>
          <button
            type="button"
            disabled={selectedIndex == null}
            onClick={onAddBookmark}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs hover:bg-muted disabled:opacity-40"
            title={t("viewer.addBookmark")}
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            {t("viewer.addBookmark")}
          </button>
        </div>
      </div>

      {indexingStatus ? (
        <div className="border-b border-border px-3 py-1 text-[11px] text-muted-foreground">
          {t("viewer.indexing")}: {indexingStatus}
        </div>
      ) : null}

      {isLoading ? (
        <div className="border-b border-border px-3 py-1 text-[11px] text-muted-foreground">
          {t("viewer.loading")}{" "}
          <span className="tabular-nums">{loadingProgress}%</span>
        </div>
      ) : null}

      <div
        ref={parentRef}
        className="min-h-0 flex-1 overflow-y-auto scrollbar-thin"
      >
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((vi) => {
            const line = lines[vi.index];
            if (!line) return null;
            const isSel = selectedIndex === vi.index;
            return (
              <div
                key={vi.key}
                data-index={vi.index}
                ref={virtualizer.measureElement}
                className={cn(
                  "absolute left-0 top-0 flex w-full border-b border-border/40",
                  isSel && "bg-accent/40",
                )}
                style={{
                  transform: `translateY(${vi.start}px)`,
                  fontSize,
                }}
                onClick={() => setSelectedIndex(vi.index)}
              >
                {showLineNumbers ? (
                  <div className="w-14 shrink-0 select-none border-r border-border/50 bg-muted/30 px-2 py-1.5 text-right font-mono text-[11px] text-muted-foreground">
                    {line.line_number}
                  </div>
                ) : null}
                <div className="min-w-0 flex-1 px-3 py-1.5 font-log">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    {line.timestamp ? (
                      <span className="shrink-0 text-[11px] font-mono text-muted-foreground">
                        {line.timestamp}
                      </span>
                    ) : null}
                    {line.level ? (
                      <span
                        className={cn(
                          "shrink-0 text-[11px] font-mono font-semibold uppercase",
                          levelTextClass(line.level),
                        )}
                      >
                        {line.level}
                      </span>
                    ) : null}
                    {line.content.module ? (
                      <span className="shrink-0 text-[11px] font-mono text-muted-foreground">
                        [{line.content.module}]
                      </span>
                    ) : null}
                    {line.is_json ? (
                      <span className="shrink-0 rounded bg-muted px-1 text-[10px] text-muted-foreground">
                        JSON
                      </span>
                    ) : null}
                  </div>
                  <div className="whitespace-pre-wrap break-words leading-relaxed text-foreground/90">
                    {hl(line.content.message || line.raw)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-border bg-card/40 px-3 py-1.5 text-[11px] text-muted-foreground">
        <span>
          {t("viewer.selectLine")}
          {selectedIndex != null && lines[selectedIndex]
            ? ` — ${t("viewer.line")} ${lines[selectedIndex]!.line_number}`
            : ""}
        </span>
        <span className="tabular-nums">
          {lines.length > 0
            ? `${lines[0]!.line_number}–${lines[lines.length - 1]!.line_number}`
            : "—"}
        </span>
      </div>
    </div>
  );
}
