// Copyright (c) 2026 jinming1345
// Licensed under AGPL-3.0. See LICENSE file for details.
// https://github.com/jinming1345/LogLens

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  searchLogs,
  type FieldFilter,
  type KeywordFilter,
  type SearchQuery,
  type SearchResult,
  type TimeRange,
} from "@/lib/tauri-api";

export type FilterLogic = "AND" | "OR";

export interface SavedFilter {
  name: string;
  query: SearchQuery;
}

export interface FilterStoreState {
  keywords: KeywordFilter[];
  timeRange: TimeRange | null;
  levels: string[];
  customFields: FieldFilter[];
  useRegex: boolean;
  caseSensitive: boolean;
  logic: FilterLogic;
  results: SearchResult | null;
  isSearching: boolean;
  savedFilters: SavedFilter[];
  addKeyword: () => void;
  removeKeyword: (index: number) => void;
  updateKeyword: (index: number, patch: Partial<KeywordFilter>) => void;
  setTimeRange: (range: TimeRange | null) => void;
  toggleLevel: (level: string) => void;
  addCustomField: () => void;
  removeCustomField: (index: number) => void;
  updateCustomField: (
    index: number,
    patch: Partial<FieldFilter>,
  ) => void;
  setUseRegex: (value: boolean) => void;
  setCaseSensitive: (value: boolean) => void;
  setLogic: (logic: FilterLogic) => void;
  applyFilter: (fileIds: string[]) => Promise<void>;
  clearFilter: () => void;
  saveFilter: (name: string) => void;
  loadFilter: (name: string) => boolean;
  deleteFilter: (name: string) => void;
}

const defaultQueryShape = (): Omit<
  FilterStoreState,
  | "results"
  | "isSearching"
  | "savedFilters"
  | "addKeyword"
  | "removeKeyword"
  | "updateKeyword"
  | "setTimeRange"
  | "toggleLevel"
  | "addCustomField"
  | "removeCustomField"
  | "updateCustomField"
  | "setUseRegex"
  | "setCaseSensitive"
  | "setLogic"
  | "applyFilter"
  | "clearFilter"
  | "saveFilter"
  | "loadFilter"
  | "deleteFilter"
> => ({
  keywords: [{ text: "", is_regex: false }],
  timeRange: null,
  levels: [],
  customFields: [],
  useRegex: false,
  caseSensitive: false,
  logic: "AND",
});

function buildSearchQuery(state: FilterStoreState): SearchQuery {
  return {
    keywords: state.keywords
      .filter((k) => k.text.trim().length > 0)
      .map((k) => ({ text: k.text, is_regex: k.is_regex })),
    time_range: state.timeRange,
    levels: state.levels,
    custom_fields: state.customFields.filter(
      (f) => f.field.trim() && f.value.trim(),
    ),
    use_regex: state.useRegex,
    case_sensitive: state.caseSensitive,
    logic: state.logic,
  };
}

export const useFilterStore = create<FilterStoreState>()(
  persist(
    (set, get) => ({
      ...defaultQueryShape(),
      results: null,
      isSearching: false,
      savedFilters: [],

      addKeyword: () =>
        set((s) => ({
          keywords: [...s.keywords, { text: "", is_regex: false }],
        })),

      removeKeyword: (index: number) =>
        set((s) => ({
          keywords:
            s.keywords.length > 1
              ? s.keywords.filter((_, i) => i !== index)
              : s.keywords,
        })),

      updateKeyword: (index: number, patch: Partial<KeywordFilter>) =>
        set((s) => ({
          keywords: s.keywords.map((k, i) =>
            i === index ? { ...k, ...patch } : k,
          ),
        })),

      setTimeRange: (range) => set({ timeRange: range }),

      toggleLevel: (level: string) =>
        set((s) => ({
          levels: s.levels.includes(level)
            ? s.levels.filter((l) => l !== level)
            : [...s.levels, level],
        })),

      addCustomField: () =>
        set((s) => ({
          customFields: [...s.customFields, { field: "", value: "" }],
        })),

      removeCustomField: (index: number) =>
        set((s) => ({
          customFields: s.customFields.filter((_, i) => i !== index),
        })),

      updateCustomField: (index: number, patch: Partial<FieldFilter>) =>
        set((s) => ({
          customFields: s.customFields.map((f, i) =>
            i === index ? { ...f, ...patch } : f,
          ),
        })),

      setUseRegex: (value) => set({ useRegex: value }),
      setCaseSensitive: (value) => set({ caseSensitive: value }),
      setLogic: (logic) => set({ logic }),

      applyFilter: async (fileIds: string[]) => {
        if (!fileIds.length) {
          set({ results: null, isSearching: false });
          return;
        }
        set({ isSearching: true, results: null });
        try {
          const query = buildSearchQuery(get());
          console.log("[LogLens] Search query:", JSON.stringify(query));
          console.log("[LogLens] File IDs:", fileIds);
          const res = await searchLogs(fileIds, query);
          console.log("[LogLens] Search results:", res.total_matches, "matches in", res.search_time_ms, "ms");
          set({ results: res, isSearching: false });
        } catch (err) {
          console.error("[LogLens] Search error:", err);
          set({
            isSearching: false,
            results: {
              matches: [],
              total_matches: 0,
              search_time_ms: 0,
            },
          });
        }
      },

      clearFilter: () =>
        set({
          ...defaultQueryShape(),
          results: null,
          isSearching: false,
        }),

      saveFilter: (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const query = buildSearchQuery(get());
        set((s) => {
          const others = s.savedFilters.filter((x) => x.name !== trimmed);
          return { savedFilters: [...others, { name: trimmed, query }] };
        });
      },

      loadFilter: (name: string) => {
        const found = get().savedFilters.find((x) => x.name === name);
        if (!found) return false;
        const q = found.query;
        set({
          keywords:
            q.keywords.length > 0
              ? q.keywords.map((k) => ({
                  text: k.text,
                  is_regex: k.is_regex,
                }))
              : [{ text: "", is_regex: false }],
          timeRange: q.time_range,
          levels: [...q.levels],
          customFields: q.custom_fields.map((f) => ({ ...f })),
          useRegex: q.use_regex,
          caseSensitive: q.case_sensitive,
          logic: (q.logic === "OR" ? "OR" : "AND") as FilterLogic,
          results: null,
        });
        return true;
      },

      deleteFilter: (name: string) =>
        set((s) => ({
          savedFilters: s.savedFilters.filter((x) => x.name !== name),
        })),
    }),
    {
      name: "loglens-filter-presets",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ savedFilters: state.savedFilters }),
    },
  ),
);
