// Copyright (c) 2026 jinming1345
// Licensed under AGPL-3.0. See LICENSE file for details.
// https://github.com/jinming1345/LogLens

import { Dashboard } from "@/components/Dashboard";
import { FilterPanel } from "@/components/FilterPanel";
import { LogViewer } from "@/components/LogViewer";
import { SearchResultsView } from "@/components/SearchResultsView";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Sidebar } from "@/components/Sidebar";
import { TitleBar } from "@/components/TitleBar";
import i18n from "@/i18n";
import { useFilterStore } from "@/stores/useFilterStore";
import { useLogStore } from "@/stores/useLogStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { open } from "@tauri-apps/plugin-dialog";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type MainView = "viewer" | "dashboard" | "settings";

function useResizable(
  initial: number,
  min: number,
  max: number,
  direction: "left" | "right",
) {
  const [width, setWidth] = useState(initial);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;
      startW.current = width;

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const delta = ev.clientX - startX.current;
        const newW =
          direction === "left"
            ? startW.current + delta
            : startW.current - delta;
        setWidth(Math.max(min, Math.min(max, newW)));
      };

      const onUp = () => {
        dragging.current = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [width, min, max, direction],
  );

  return { width, onMouseDown };
}

export default function App() {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);

  const openFile = useLogStore((s) => s.openFile);
  const openFolder = useLogStore((s) => s.openFolder);
  const searchResults = useFilterStore((s) => s.results);
  const hasSearchResults = searchResults !== null && searchResults.matches.length > 0;

  const [view, setView] = useState<MainView>("viewer");
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    if (hasSearchResults) setShowSearchResults(true);
    if (!hasSearchResults) setShowSearchResults(false);
  }, [hasSearchResults]);
  const [filterOpen, setFilterOpen] = useState(true);
  const [filterFocusNonce, setFilterFocusNonce] = useState(0);
  const [dropHint, setDropHint] = useState(false);

  const sidebar = useResizable(240, 160, 420, "left");
  const filter = useResizable(360, 260, 560, "right");

  useEffect(() => {
    void i18n.changeLanguage(language === "zh" ? "zh" : "en");
  }, [language]);

  const pickAndOpenFile = useCallback(async () => {
    const path = await open({ multiple: false, directory: false });
    if (typeof path === "string") await openFile(path);
  }, [openFile]);

  const pickAndOpenFolder = useCallback(async () => {
    const path = await open({ multiple: false, directory: true });
    if (typeof path === "string") await openFolder(path);
  }, [openFolder]);

  const handleDroppedPaths = useCallback(
    async (paths: string[]) => {
      for (const p of paths) {
        try {
          await openFile(p);
        } catch {
          try {
            await openFolder(p);
          } catch {
            /* ignore */
          }
        }
      }
    },
    [openFile, openFolder],
  );

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void getCurrentWebviewWindow()
      .onDragDropEvent((event) => {
        if (event.payload.type === "enter" || event.payload.type === "over") {
          setDropHint(true);
        } else if (event.payload.type === "leave") {
          setDropHint(false);
        } else if (event.payload.type === "drop") {
          setDropHint(false);
          void handleDroppedPaths(event.payload.paths);
        }
      })
      .then((fn) => {
        unlisten = fn;
      });
    return () => {
      unlisten?.();
    };
  }, [handleDroppedPaths]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      const key = e.key.toLowerCase();

      if (key === "o" && !e.shiftKey) {
        e.preventDefault();
        void pickAndOpenFile();
      } else if (key === "o" && e.shiftKey) {
        e.preventDefault();
        void pickAndOpenFolder();
      } else if (key === "k") {
        e.preventDefault();
        setFilterOpen((v) => !v);
      } else if (key === "f") {
        e.preventDefault();
        setFilterOpen(true);
        setFilterFocusNonce((n) => n + 1);
      } else if (key === ",") {
        e.preventDefault();
        setView("settings");
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const tgt = e.target;
      if (tgt instanceof HTMLInputElement || tgt instanceof HTMLTextAreaElement) {
        return;
      }
      setFilterOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [pickAndOpenFile, pickAndOpenFolder]);

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-background text-foreground">
      {dropHint ? (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center border-2 border-dashed border-primary/50 bg-background/70 backdrop-blur-sm">
          <div className="rounded-lg border border-border bg-card px-6 py-4 text-center shadow-lg">
            <p className="text-sm font-medium">{t("file.dropReady")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("file.dragHint")}
            </p>
          </div>
        </div>
      ) : null}

      <TitleBar
        filterOpen={filterOpen}
        onToggleFilter={() => setFilterOpen((v) => !v)}
      />

      <div className="flex min-h-0 flex-1">
        <div style={{ width: sidebar.width }} className="shrink-0">
          <Sidebar currentView={view} onSelectView={setView} />
        </div>

        {/* Sidebar resize handle */}
        <div
          className="group relative z-10 w-1 shrink-0 cursor-col-resize bg-border/50 transition-colors hover:bg-primary/40 active:bg-primary/60"
          onMouseDown={sidebar.onMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        <main className="relative min-h-0 min-w-0 flex-1 bg-background">
          {view === "viewer" && showSearchResults ? (
            <SearchResultsView
              onJumpToSource={() => setShowSearchResults(false)}
            />
          ) : null}
          {view === "viewer" && !showSearchResults ? (
            <>
              <LogViewer />
              {hasSearchResults ? (
                <button
                  type="button"
                  onClick={() => setShowSearchResults(true)}
                  className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-lg hover:bg-accent"
                >
                  {t("search.backToResults") ?? "← 返回搜索结果"}
                  {" "}({searchResults?.total_matches})
                </button>
              ) : null}
            </>
          ) : null}
          {view === "dashboard" ? <Dashboard /> : null}
          {view === "settings" ? <SettingsPanel /> : null}
        </main>

        {filterOpen ? (
          <>
            {/* Filter panel resize handle */}
            <div
              className="group relative z-10 w-1 shrink-0 cursor-col-resize bg-border/50 transition-colors hover:bg-primary/40 active:bg-primary/60"
              onMouseDown={filter.onMouseDown}
            >
              <div className="absolute inset-y-0 -left-1 -right-1" />
            </div>

            <div style={{ width: filter.width }} className="shrink-0">
              <FilterPanel focusNonce={filterFocusNonce} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
