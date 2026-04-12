import { exportResults, type ExportLine } from "@/lib/tauri-api";
import { save } from "@tauri-apps/plugin-dialog";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type ExportDialogProps = {
  open: boolean;
  onClose: () => void;
  buildLines: () => ExportLine[];
  defaultSourceLabel: string;
};

const formats = [
  { id: "jsonl", labelKey: "export.formatJson" as const },
  { id: "csv", labelKey: "export.formatCsv" as const },
  { id: "txt", labelKey: "export.formatTxt" as const },
];

export function ExportDialog({
  open,
  onClose,
  buildLines,
  defaultSourceLabel,
}: ExportDialogProps) {
  const { t } = useTranslation();
  const [format, setFormat] = useState("jsonl");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!open) return null;

  const run = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const lines = buildLines();
      if (!lines.length) {
        setMessage(t("search.noResults"));
        setBusy(false);
        return;
      }
      const path = await save({
        defaultPath:
          format === "csv"
            ? "loglens-export.csv"
            : format === "txt"
              ? "loglens-export.txt"
              : "loglens-export.jsonl",
        filters: [
          {
            name: "Export",
            extensions:
              format === "csv" ? ["csv"] : format === "txt" ? ["txt"] : ["jsonl"],
          },
        ],
      });
      if (!path) {
        setBusy(false);
        return;
      }
      await exportResults(lines, format, path);
      setMessage(t("export.success"));
    } catch {
      setMessage(t("export.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-lg border border-border bg-card p-4 shadow-lg"
        role="dialog"
        aria-modal
      >
        <h3 className="text-base font-semibold">{t("export.title")}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("export.source")}: {defaultSourceLabel}
        </p>

        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium">{t("export.format")}</div>
          <div className="flex flex-col gap-2">
            {formats.map((f) => (
              <label
                key={f.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                <input
                  type="radio"
                  name="export-format"
                  checked={format === f.id}
                  onChange={() => setFormat(f.id)}
                />
                <span>{t(f.labelKey)}</span>
              </label>
            ))}
          </div>
        </div>

        {message ? (
          <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
            onClick={onClose}
            disabled={busy}
          >
            {t("export.cancel")}
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
            onClick={() => void run()}
            disabled={busy}
          >
            {busy ? t("export.exporting") : t("export.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
