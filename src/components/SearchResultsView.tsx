// Copyright (c) 2026 jinming1345
// Licensed under AGPL-3.0. See LICENSE file for details.
// https://github.com/jinming1345/LogLens

import { cn } from "@/lib/utils";
import { highlightText } from "@/lib/highlight";
import { useFilterStore } from "@/stores/useFilterStore";
import { useLogStore } from "@/stores/useLogStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowRight, X } from "lucide-react";
import { useMemo, useRef } from "react";
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

type Props = {
  onJumpToSource?: () => void;
};

export function SearchResultsView({ onJumpToSource }: Props) {
  const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement>(null);

  const results = useFilterStore((s) => s.results);
  const clearFilter = useFilterStore((s) => s.clearFilter);
  const keywords = useFilterStore((s) => s.keywords);
  const caseSensitive = useFilterStore((s) => s.caseSensitive);
  const focusLineInFile = useLogStore((s) => s.focusLineInFile);
  const fontSize = useSettingsStore((s) => s.fontSize);

  const matches = results?.matches ?? [];

  const kwTexts = useMemo(
    () => keywords.map((k) => k.text).filter((t) => t.trim().length > 0),
    [keywords],
  );

  const hl = (text: string) => highlightText(text, kwTexts, caseSensitive);

  const virtualizer = useVirtualizer({
    count: matches.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => Math.max(60, Math.round(fontSize * 4)),
    overscan: 6,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  if (!results || matches.length === 0) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-background/60 px-3 py-2">
        <div>
          <div className="text-sm font-medium">
            {t("search.results", { count: results.total_matches })}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {t("search.time", { ms: results.search_time_ms })}
          </div>
        </div>
        <button
          type="button"
          onClick={() => clearFilter()}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs hover:bg-muted"
        >
          <X className="h-3 w-3" />
          {t("filter.clear")}
        </button>
      </div>

      <div
        ref={parentRef}
        className="min-h-0 flex-1 overflow-y-auto scrollbar-thin"
      >
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((vi) => {
            const m = matches[vi.index];
            if (!m) return null;
            return (
              <div
                key={vi.key}
                data-index={vi.index}
                ref={virtualizer.measureElement}
                className="absolute left-0 top-0 w-full border-b border-border/40 px-3 py-2"
                style={{
                  transform: `translateY(${vi.start}px)`,
                  fontSize,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {m.file_name}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {t("viewer.line")} {m.line_number}
                  </span>
                  {m.content.level ? (
                    <span
                      className={cn(
                        "shrink-0 text-[11px] font-semibold uppercase",
                        levelTextClass(m.content.level),
                      )}
                    >
                      {m.content.level}
                    </span>
                  ) : null}
                  {m.content.timestamp ? (
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                      {m.content.timestamp}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      void focusLineInFile(m.file_id, m.line_number);
                      onJumpToSource?.();
                    }}
                    className="ml-auto shrink-0 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-primary hover:bg-primary/10"
                    title={t("search.openInViewer")}
                  >
                    <ArrowRight className="h-3 w-3" />
                    {t("search.openInViewer")}
                  </button>
                </div>

                {m.context_before.length > 0 ? (
                  <div className="mt-1 space-y-0.5 border-l-2 border-muted pl-2 font-log text-[12px] text-muted-foreground/70">
                    {m.context_before.map((line, i) => (
                      <div key={`b${i}`} className="truncate">{line}</div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-1 whitespace-pre-wrap break-words font-log leading-relaxed text-foreground/90">
                  {hl(m.content.message || m.content.raw)}
                </div>

                {m.context_after.length > 0 ? (
                  <div className="mt-1 space-y-0.5 border-l-2 border-muted pl-2 font-log text-[12px] text-muted-foreground/70">
                    {m.context_after.map((line, i) => (
                      <div key={`a${i}`} className="truncate">{line}</div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
