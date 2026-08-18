"use client";

import React from "react";
import { C } from "./theme";

export function TopoRings({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="220" height="220" viewBox="0 0 220 220" style={{ position: "absolute", opacity: 0.5, ...style }}>
      {[30, 55, 80, 105, 130].map((r, i) => (
        <circle key={i} cx="110" cy="110" r={r} fill="none" stroke={C.borderStrong} strokeWidth="1" />
      ))}
    </svg>
  );
}
