import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Bookmark {
  id: string;
  fileId: string;
  fileName: string;
  lineNumber: number;
  note: string;
  content: string;
  createdAt: string;
}

export interface BookmarkStoreState {
  bookmarks: Bookmark[];
  addBookmark: (b: Omit<Bookmark, "id" | "createdAt"> & { id?: string }) => void;
  removeBookmark: (id: string) => void;
  updateNote: (id: string, note: string) => void;
  clearBookmarks: () => void;
  getBookmarksForFile: (fileId: string) => Bookmark[];
}

function randomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `bm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

export const useBookmarkStore = create<BookmarkStoreState>()(
  persist(
    (set, get) => ({
      bookmarks: [],

      addBookmark: (input) => {
        const id = input.id ?? randomId();
        const createdAt = new Date().toISOString();
        const entry: Bookmark = {
          id,
          fileId: input.fileId,
          fileName: input.fileName,
          lineNumber: input.lineNumber,
          note: input.note,
          content: input.content,
          createdAt,
        };
        set((s) => ({
          bookmarks: [
            entry,
            ...s.bookmarks.filter(
              (b) =>
                !(b.fileId === entry.fileId && b.lineNumber === entry.lineNumber),
            ),
          ],
        }));
      },

      removeBookmark: (id: string) =>
        set((s) => ({
          bookmarks: s.bookmarks.filter((b) => b.id !== id),
        })),

      updateNote: (id: string, note: string) =>
        set((s) => ({
          bookmarks: s.bookmarks.map((b) =>
            b.id === id ? { ...b, note } : b,
          ),
        })),

      clearBookmarks: () => set({ bookmarks: [] }),

      getBookmarksForFile: (fileId: string) =>
        get().bookmarks.filter((b) => b.fileId === fileId),
    }),
    {
      name: "loglens-bookmarks",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
