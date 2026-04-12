// Copyright (c) 2026 jinming1345
// Licensed under AGPL-3.0. See LICENSE file for details.
// https://github.com/jinming1345/LogLens

import type { ReactNode } from "react";

export function highlightText(
  text: string,
  keywords: string[],
  caseSensitive: boolean,
): ReactNode {
  if (!text || keywords.length === 0) return text;

  const validKeywords = keywords.filter((k) => k.trim().length > 0);
  if (validKeywords.length === 0) return text;

  const escaped = validKeywords.map((k) =>
    k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const flags = caseSensitive ? "g" : "gi";
  const pattern = new RegExp(`(${escaped.join("|")})`, flags);

  const parts = text.split(pattern);
  if (parts.length <= 1) return text;

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = pattern.test(part);
        pattern.lastIndex = 0;
        if (isMatch) {
          return (
            <mark
              key={i}
              className="rounded-sm bg-yellow-300/70 px-0.5 text-foreground dark:bg-yellow-500/40"
            >
              {part}
            </mark>
          );
        }
        return part;
      })}
    </>
  );
}
