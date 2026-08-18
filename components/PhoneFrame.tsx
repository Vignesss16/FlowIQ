"use client";
import React from "react";
import { C } from "./ui/theme";

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: 390, background: C.card, border: `1px solid ${C.borderStrong}`, borderRadius: 26, padding: "10px 10px 18px", boxSizing: "border-box" }}>
      <div style={{ height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 60, height: 4, borderRadius: 999, background: C.border }} />
      </div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", background: C.bg, minHeight: 640 }}>
        {children}
      </div>
    </div>
  );
}
