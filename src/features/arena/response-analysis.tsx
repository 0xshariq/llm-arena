"use client";

import { useMemo } from "react";

import type { ResponseState } from "./turn-state";

function tokenize(text: string) {
  return new Set(text.toLowerCase().match(/[a-z0-9]{4,}/g) ?? []);
}

function overlap(a: string, b: string) {
  const left = tokenize(a);
  const right = tokenize(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  left.forEach((word) => {
    if (right.has(word)) shared += 1;
  });
  return Math.round((shared / Math.max(left.size, right.size)) * 100);
}

export function ResponseAnalysis({ responses }: { responses: readonly ResponseState[] }) {
  const result = useMemo(() => {
    const complete = responses.filter(
      (response) => response.status === "COMPLETE" && response.text,
    );
    if (complete.length < 2) return null;
    const scores = complete
      .slice(1)
      .map((response) => overlap(complete[0].text, response.text));
    const agreement = Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length,
    );
    return {
      agreement,
      label:
        agreement >= 55
          ? "Mostly aligned"
          : agreement >= 25
            ? "Mixed perspectives"
            : "Distinct perspectives",
    };
  }, [responses]);

  if (!result) return null;

  return (
    <aside className="border-border bg-muted/40 flex items-center justify-between gap-4 border-t px-4 py-3 text-sm">
      <div>
        <p className="font-medium">Answer comparison</p>
        <p className="text-muted-foreground text-xs">
          Based on shared key ideas across completed answers.
        </p>
      </div>
      <div className="text-right">
        <p className="text-primary font-mono text-lg">{result.agreement}%</p>
        <p className="text-muted-foreground text-xs">{result.label}</p>
      </div>
    </aside>
  );
}
