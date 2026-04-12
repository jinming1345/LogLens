// Copyright (c) 2026 jinming1345
// Licensed under AGPL-3.0. See LICENSE file for details.
// https://github.com/jinming1345/LogLens

import { create } from "zustand";
import {
  getLines,
  openFile as tauriOpenFile,
  openFolder as tauriOpenFolder,
  type FileInfo,
  type LogLine,
} from "@/lib/tauri-api";

export interface LogStoreState {
  files: FileInfo[];
  activeFileId: string | null;
  lines: LogLine[];
  isLoading: boolean;
  loadingProgress: number;
  indexingStatus: string;
  scrollToLineNumber: number | null;
  openFile: (path: string) => Promise<void>;
  openFolder: (path: string) => Promise<void>;
  setActiveFile: (id: string | null) => void;
  loadLines: (fileId: string, start: number, count: number) => Promise<void>;
  requestScrollToLine: (lineNumber: number) => void;
  focusLineInFile: (fileId: string, lineNumber: number) => Promise<void>;
  clearScrollTarget: () => void;
  closeFile: (id: string) => void;
  closeAllFiles: () => void;
}

function mergeFiles(existing: FileInfo[], incoming: FileInfo[]): FileInfo[] {
  const map = new Map<string, FileInfo>();
  for (const f of existing) map.set(f.id, f);
  for (const f of incoming) map.set(f.id, f);
  return Array.from(map.values());
}

export const useLogStore = create<LogStoreState>((set, get) => ({
  files: [],
  activeFileId: null,
  lines: [],
  isLoading: false,
  loadingProgress: 0,
  indexingStatus: "",
  scrollToLineNumber: null,

  requestScrollToLine: (lineNumber: number) => {
    set({ scrollToLineNumber: lineNumber });
  },

  clearScrollTarget: () => set({ scrollToLineNumber: null }),

  focusLineInFile: async (fileId: string, lineNumber: number) => {
    set({
      isLoading: true,
      loadingProgress: 10,
      activeFileId: fileId,
      scrollToLineNumber: lineNumber,
    });
    try {
      const start = Math.max(1, lineNumber - 150);
      const lines = await getLines(fileId, start, 600);
      set({ lines, loadingProgress: 100 });
    } catch {
      set({ lines: [], loadingProgress: 0 });
      throw new Error("Failed to load around line");
    } finally {
      set({ isLoading: false });
    }
  },

  openFile: async (path: string) => {
    set({ isLoading: true, loadingProgress: 5, indexingStatus: "" });
    try {
      const info = await tauriOpenFile(path);
      set((s) => ({
        files: mergeFiles(s.files, [info]),
        activeFileId: info.id,
        loadingProgress: 40,
      }));
      await get().loadLines(info.id, 1, 1000);
      set({ loadingProgress: 100, indexingStatus: "" });
    } finally {
      set({ isLoading: false });
    }
  },

  openFolder: async (path: string) => {
    set({ isLoading: true, loadingProgress: 5, indexingStatus: "" });
    try {
      const list = await tauriOpenFolder(path);
      set((s) => ({
        files: mergeFiles(s.files, list),
        activeFileId: list[0]?.id ?? s.activeFileId,
        loadingProgress: list.length ? 60 : 100,
      }));
      const first = list[0];
      if (first) {
        await get().loadLines(first.id, 1, 1000);
      }
      set({ loadingProgress: 100 });
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveFile: (id) => {
    set({ activeFileId: id });
    if (id) {
      void get().loadLines(id, 1, 1000);
    } else {
      set({ lines: [] });
    }
  },

  loadLines: async (fileId: string, start: number, count: number) => {
    set({ isLoading: true, loadingProgress: 10, activeFileId: fileId });
    try {
      const lines = await getLines(fileId, start, count);
      set({ lines, loadingProgress: 100 });
    } catch {
      set({ lines: [], loadingProgress: 0 });
      throw new Error("Failed to load lines");
    } finally {
      set({ isLoading: false });
    }
  },

  closeFile: (id: string) => {
    const { activeFileId, files } = get();
    const nextFiles = files.filter((f) => f.id !== id);
    let nextActive = activeFileId;
    if (activeFileId === id) {
      nextActive = nextFiles[0]?.id ?? null;
      set({
        files: nextFiles,
        activeFileId: nextActive,
        lines: [],
      });
      if (nextActive) {
        void get().loadLines(nextActive, 1, 1000);
      }
    } else {
      set({ files: nextFiles });
    }
  },

  closeAllFiles: () => {
    set({
      files: [],
      activeFileId: null,
      lines: [],
      loadingProgress: 0,
      indexingStatus: "",
      scrollToLineNumber: null,
    });
  },
}));
