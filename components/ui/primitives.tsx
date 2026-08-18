"use client";

import React from "react";
import { C, HEALTH_COLOR, HEALTH_TINT } from "./theme";

export function Eyebrow({ children, color = C.body }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      className="fiq-mono"
      style={{
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color,
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  );
}

export function Pill({ health, size = "md" }: { health: string; size?: "sm" | "md" }) {
  const label = health === "green" ? "FAST" : health === "amber" ? "MODERATE" : health === "red" ? "BUSY" : "CLOSED";
  const color = HEALTH_COLOR[health as keyof typeof HEALTH_COLOR] || C.gray;
  const tint = HEALTH_TINT[health as keyof typeof HEALTH_TINT] || C.grayTint;
  return (
    <span
      className="fiq-mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: size === "sm" ? 10 : 11,
        fontWeight: 600,
        letterSpacing: "0.06em",
        color,
        background: tint,
        border: `1px solid ${color}33`,
        padding: size === "sm" ? "3px 7px" : "4px 9px",
        borderRadius: 4,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

export function LoadBadge({ load }: { load: string }) {
  const label = load === "green" ? "LOW LOAD" : load === "amber" ? "MED LOAD" : "HIGH LOAD";
  const color = load === "green" ? C.green : load === "amber" ? C.amber : C.red;
  const tint = load === "green" ? C.greenTint : load === "amber" ? C.amberTint : C.redTint;
  return (
    <span
      className="fiq-mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.05em",
        color,
        background: tint,
        border: `1px solid ${color}33`,
        padding: "3px 7px",
        borderRadius: 4,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

export function StatusBadge({ health }: { health: string }) {
  const color = HEALTH_COLOR[health as keyof typeof HEALTH_COLOR] || C.gray;
  const tint = HEALTH_TINT[health as keyof typeof HEALTH_TINT] || C.grayTint;
  return (
    <span
      className="fiq-mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.08em",
        color,
        background: tint,
        border: `1px solid ${color}40`,
        padding: "5px 10px",
        borderRadius: 4,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: 999, background: color }} className={health === "CRITICAL" ? "fiq-pulse" : ""} />
      {health}
    </span>
  );
}

export function Card({ children, style, className = "" }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div
      className={className}
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function PrimaryButton({ children, onClick, full, disabled, icon: Icon }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="fiq-mono"
      style={{
        width: full ? "100%" : undefined,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: disabled ? C.gray : C.accent,
        color: "#FBF9F5",
        border: "none",
        borderRadius: 8,
        padding: "13px 20px",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        cursor: disabled ? "default" : "pointer",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = C.accentDark)}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.background = C.accent)}
    >
      {Icon && <Icon size={15} strokeWidth={2.25} />}
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, full }: any) {
  return (
    <button
      onClick={onClick}
      className="fiq-mono"
      style={{
        width: full ? "100%" : undefined,
        background: "transparent",
        color: C.ink,
        border: `1px solid ${C.borderStrong}`,
        borderRadius: 8,
        padding: "13px 20px",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function MobileHeader({ title = "FLOWIQ", right }: { title?: string; right?: React.ReactNode }) {
  return (
    <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div className="fiq-display" style={{ fontSize: 22, color: C.ink, fontWeight: 800, letterSpacing: "-0.01em" }}>
        {title}
      </div>
      {right}
    </div>
  );
}
