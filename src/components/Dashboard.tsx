// Copyright (c) 2026 jinming1345
// Licensed under AGPL-3.0. See LICENSE file for details.
// https://github.com/jinming1345/LogLens

import { getLogStats, type LogStats } from "@/lib/tauri-api";
import { useLogStore } from "@/stores/useLogStore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

const LEVEL_COLORS: Record<string, string> = {
  DEBUG: "hsl(210, 50%, 55%)",
  INFO: "hsl(142, 71%, 40%)",
  WARN: "hsl(38, 92%, 50%)",
  ERROR: "hsl(0, 84%, 60%)",
  FATAL: "hsl(300, 70%, 45%)",
};

function getLevelColor(name: string): string {
  return LEVEL_COLORS[name.toUpperCase()] ?? "hsl(var(--primary))";
}

export function Dashboard() {
  const { t } = useTranslation();
  const files = useLogStore((s) => s.files);
  const activeFileId = useLogStore((s) => s.activeFileId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<LogStats | null>(null);

  const activeFile = useMemo(
    () => files.find((f) => f.id === activeFileId) ?? null,
    [files, activeFileId],
  );

  const isRefreshing = useRef(false);

  const refresh = useCallback(async () => {
    if (!activeFileId || isRefreshing.current) {
      if (!activeFileId) setStats(null);
      return;
    }
    isRefreshing.current = true;
    setLoading(true);
    setError(null);
    try {
      const s = await getLogStats([activeFileId]);
      setStats(s);
    } catch {
      setError(t("dashboard.loadError"));
      setStats(null);
    } finally {
      setLoading(false);
      isRefreshing.current = false;
    }
  }, [activeFileId, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!activeFile) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("dashboard.empty")}</p>
      </div>
    );
  }

  const levelOrder = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"];
  const levelData = stats
    ? levelOrder
        .filter((name) => (stats.level_counts[name] ?? 0) > 0)
        .map((name) => ({
          name,
          value: stats.level_counts[name] ?? 0,
        }))
    : [];

  const hourly = stats?.hourly_distribution ?? [];
  const topErrors = stats?.top_errors ?? [];

  const totalLines = stats?.total_lines ?? 0;
  const errorCount =
    (stats?.level_counts["ERROR"] ?? 0) + (stats?.level_counts["FATAL"] ?? 0);
  const warnCount = stats?.level_counts["WARN"] ?? 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 scrollbar-thin">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{t("dashboard.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {activeFile.name}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
        >
          {loading ? t("dashboard.loading") : t("dashboard.refresh")}
        </button>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      {stats ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("dashboard.totalLines")}
            </div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">
              {totalLines.toLocaleString()}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("dashboard.errorCount") ?? "错误 / 致命"}
            </div>
            <div className="mt-2 text-3xl font-semibold tabular-nums text-log-error">
              {errorCount.toLocaleString()}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("dashboard.warnCount") ?? "警告"}
            </div>
            <div className="mt-2 text-3xl font-semibold tabular-nums text-log-warn">
              {warnCount.toLocaleString()}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-sm md:col-span-3">
            <div className="mb-3 text-sm font-medium">
              {t("dashboard.levelDistribution")}
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={levelData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  />
                  <Bar
                    dataKey="value"
                    name={t("dashboard.chartLegendLines")}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={60}
                    isAnimationActive={false}
                  >
                    {levelData.map((entry) => (
                      <Cell key={entry.name} fill={getLevelColor(entry.name)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-sm md:col-span-3">
            <div className="mb-1 text-sm font-medium">{t("dashboard.hourlyTitle")}</div>
            <div className="mb-3 text-xs text-muted-foreground">
              {t("dashboard.hourlySubtitle")}
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={hourly}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 5 }}
                    name={t("dashboard.chartLegendLines")}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-sm md:col-span-3">
            <div className="mb-2 text-sm font-medium">{t("dashboard.topErrors")}</div>
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">{t("dashboard.message")}</th>
                    <th className="w-24 px-3 py-2 text-right font-medium">{t("dashboard.count")}</th>
                  </tr>
                </thead>
                <tbody>
                  {topErrors.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-muted-foreground" colSpan={2}>
                        {t("search.noResults")}
                      </td>
                    </tr>
                  ) : (
                    topErrors.map((e, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2 align-top font-mono text-[12px]">{e.message}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">{e.count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : !loading ? (
        <p className="text-sm text-muted-foreground">{t("dashboard.empty")}</p>
      ) : null}
    </div>
  );
}
