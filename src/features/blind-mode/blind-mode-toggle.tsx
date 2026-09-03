"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";

import { readBlindMode, writeBlindMode } from "./blind-mode";

export const BlindModeToggle = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => setEnabled(readBlindMode()), []);

  return (
    <label className="text-muted-foreground inline-flex cursor-pointer items-center gap-2 text-xs">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => {
          const next = event.target.checked;
          setEnabled(next);
          writeBlindMode(next);
          posthog.capture("blind_mode_toggled", { enabled: next });
        }}
        className="accent-primary size-3.5"
      />
      Hide model names
    </label>
  );
};
