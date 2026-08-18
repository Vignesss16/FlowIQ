"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LogIn } from "lucide-react";
import { C } from "@/components/ui/theme";
import { PrimaryButton, SecondaryButton } from "@/components/ui/primitives";
import { TopoRings } from "@/components/ui/TopoRings";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: C.bg, overflow: "hidden", position: "relative" }}>
      <TopoRings style={{ top: -100, right: -100, opacity: 0.3 }} />
      <TopoRings style={{ bottom: -100, left: -100, opacity: 0.3 }} />

      <header style={{ padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 10 }}>
        <div className="fiq-display" style={{ fontSize: 28, fontWeight: 800, color: C.ink, letterSpacing: "-0.02em" }}>FLOWIQ</div>
        <button
          onClick={() => router.push('/auth')}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "transparent", border: `1px solid ${C.borderStrong}`,
            padding: "8px 16px", borderRadius: 999,
            cursor: "pointer", color: C.ink, fontSize: 13, fontWeight: 600
          }}
          className="fiq-mono"
        >
          <LogIn size={14} />
          Staff Login
        </button>
      </header>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", position: "relative", zIndex: 10 }}>
        <div style={{ textAlign: "center", maxWidth: 600 }}>
          <div className="fiq-mono" style={{ fontSize: 12, color: C.accent, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 16 }}>
            SMART QUEUE MANAGEMENT
          </div>
          <h1 className="fiq-display" style={{ fontSize: 64, lineHeight: 1.05, color: C.ink, fontWeight: 900, marginBottom: 24, letterSpacing: "-0.02em" }}>
            Skip the line.<br/>Keep your time.
          </h1>
          <p style={{ fontSize: 18, color: C.body, lineHeight: 1.6, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
            FlowIQ transforms physical queues into digital tokens. Book your spot, get an AI-predicted wait time, and we'll alert you when it's your turn.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
            <PrimaryButton icon={ArrowRight} onClick={() => router.push('/auth?type=user&redirect=/book')} style={{ padding: "16px 32px", fontSize: 16 }}>
              Join the Queue Now
            </PrimaryButton>
            <span className="fiq-mono" style={{ fontSize: 12, color: C.bodyLight }}>
              Create a free account to track your queue status.
            </span>
          </div>
        </div>
      </main>

      <footer style={{ padding: "24px", textAlign: "center", borderTop: `1px solid ${C.border}`, position: "relative", zIndex: 10 }}>
        <span className="fiq-mono" style={{ fontSize: 12, color: C.bodyLight }}>
          © {new Date().getFullYear()} FlowIQ Hackathon Submission
        </span>
      </footer>
    </div>
  );
}
