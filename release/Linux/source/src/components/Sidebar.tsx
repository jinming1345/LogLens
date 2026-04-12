import { cn } from "@/lib/utils";
import { useBookmarkStore } from "@/stores/useBookmarkStore";
import { useLogStore } from "@/stores/useLogStore";
import {
  Bookmark,
  FileText,
  FolderOpen,
  LayoutDashboard,
  ScrollText,
  Settings,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { open } from "@tauri-apps/plugin-dialog";
import type { ReactNode } from "react";

type View = "viewer" | "dashboard" | "settings";

type SidebarProps = {
  currentView: View;
  onSelectView: (v: View) => void;
};

export function Sidebar({ currentView, onSelectView }: SidebarProps) {
  const { t } = useTranslation();
  const files = useLogStore((s) => s.files);
  const activeFileId = useLogStore((s) => s.activeFileId);
  const setActiveFile = useLogStore((s) => s.setActiveFile);
  const closeFile = useLogStore((s) => s.closeFile);
  const openFile = useLogStore((s) => s.openFile);
  const openFolder = useLogStore((s) => s.openFolder);
  const focusLineInFile = useLogStore((s) => s.focusLineInFile);

  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);

  const pickFile = async () => {
    const path = await open({ multiple: false, directory: false });
    if (typeof path === "string") await openFile(path);
  };

  const pickFolder = async () => {
    const path = await open({ multiple: false, directory: true });
    if (typeof path === "string") await openFolder(path);
  };

  const navBtn = (id: View, icon: ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => onSelectView(id)}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
        currentView === id
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );

  return (
    <aside className="flex h-full w-full flex-col bg-card/40">
      <div className="space-y-1 border-b border-border p-2">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => void pickFile()}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <FileText className="h-3.5 w-3.5" />
            {t("sidebar.openFile")}
          </button>
          <button
            type="button"
            onClick={() => void pickFolder()}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            {t("sidebar.openFolder")}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-2">
          <div className="mb-1 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("nav.viewer")}
          </div>
          {navBtn(
            "viewer",
            <ScrollText className="h-4 w-4 shrink-0" />,
            t("nav.viewer"),
          )}
          {navBtn(
            "dashboard",
            <LayoutDashboard className="h-4 w-4 shrink-0" />,
            t("nav.dashboard"),
          )}
          {navBtn(
            "settings",
            <Settings className="h-4 w-4 shrink-0" />,
            t("nav.settings"),
          )}
        </div>

        <div className="border-t border-border p-2">
          <div className="mb-1 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("sidebar.files")}
          </div>
          {files.length === 0 ? (
            <p className="px-1 text-xs text-muted-foreground">
              {t("sidebar.noFiles")}
            </p>
          ) : (
            <ul className="space-y-1">
              {files.map((f) => (
                <li key={f.id}>
                  <div
                    className={cn(
                      "group flex items-center gap-1 rounded-md border border-transparent px-1 py-1",
                      activeFileId === f.id && "border-border bg-muted/60",
                    )}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate text-left text-xs"
                      onClick={() => setActiveFile(f.id)}
                    >
                      <span className="block truncate font-medium">
                        {f.name}
                      </span>
                      <span className="block truncate text-[10px] text-muted-foreground">
                        {f.total_lines.toLocaleString()} {t("sidebar.lines")}
                      </span>
                    </button>
                    <button
                      type="button"
                      title={t("sidebar.closeFile")}
                      className="opacity-0 transition group-hover:opacity-100"
                      onClick={() => closeFile(f.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border p-2">
          <div className="mb-1 flex items-center gap-1 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <Bookmark className="h-3.5 w-3.5" />
            {t("sidebar.bookmarksSection")}
          </div>
          {bookmarks.length === 0 ? (
            <p className="px-1 text-xs text-muted-foreground">
              {t("sidebar.noBookmarks")}
            </p>
          ) : (
            <ul className="space-y-1">
              {bookmarks.slice(0, 40).map((b) => (
                <li key={b.id}>
                  <div className="flex items-start gap-1 rounded-md px-1 py-1 hover:bg-muted/60">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left text-xs"
                      onClick={() => {
                        onSelectView("viewer");
                        void focusLineInFile(b.fileId, b.lineNumber);
                      }}
                    >
                      <span className="block truncate font-medium">
                        {b.fileName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {t("bookmarks.line", { n: b.lineNumber })}
                      </span>
                    </button>
                    <button
                      type="button"
                      title={t("bookmarks.remove")}
                      onClick={() => removeBookmark(b.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
