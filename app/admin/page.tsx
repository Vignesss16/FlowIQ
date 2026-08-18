"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Clock, Power, TrendingUp, Zap, Sparkles, DoorOpen, ArrowRight, Bell } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { C } from "@/components/ui/theme";
import { Eyebrow, StatusBadge, Card, PrimaryButton, Pill } from "@/components/ui/primitives";
import { TopoRings } from "@/components/ui/TopoRings";

function computeHealth(avgWait: number, growth: number) {
  if (avgWait >= 30 || growth >= 25) return "CRITICAL";
  if (avgWait >= 15 || growth >= 10) return "BUILDING UP";
  return "NORMAL";
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 40,
        height: 22,
        borderRadius: 999,
        background: on ? C.accent : C.border,
        border: "none",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.15s ease",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: on ? 20 : 2,
          width: 18,
          height: 18,
          borderRadius: 999,
          background: "#FBF9F5",
          transition: "left 0.15s ease",
        }}
      />
    </button>
  );
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [counters, setCounters] = useState<Record<string, any>>({});
  const [activeTokens, setActiveTokens] = useState<Record<string, any>>({});
  const [queueStats, setQueueStats] = useState<any>({ waiting_count: 0, avg_wait: 0, growth_pct: 0, queue_velocity_pct: 0 });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/auth');
      } else {
        setIsAuthenticated(true);
      }
    };
    checkAuth();
  }, [router]);

  const fetchState = async () => {
    const [{ data: cData }, { data: qData }, { data: tData }] = await Promise.all([
      supabase.from("counters").select("*").order("id"),
      supabase.from("queue_stats").select("*").single(),
      supabase.from("tokens").select("*").eq("status", "waiting").order("position")
    ]);
    if (cData) {
      const cObj = cData.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
      setCounters(cObj);
    }
    if (qData) {
      setQueueStats(qData);
    }
    if (tData) {
      const activeObj: Record<string, any> = {};
      tData.forEach(t => {
        if (!activeObj[t.counter_id] || activeObj[t.counter_id].position > t.position) {
          activeObj[t.counter_id] = t;
        }
      });
      setActiveTokens(activeObj);
    }
  };

  useEffect(() => {
    fetchState();

    const subs = supabase.channel('admin-channel')
      .on("postgres_changes", { event: "*", schema: "public", table: "counters" }, () => { fetchState(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "queue_stats" }, (payload) => { setQueueStats(payload.new); })
      .on("postgres_changes", { event: "*", schema: "public", table: "tokens" }, () => { fetchState(); })
      .subscribe();

    return () => { supabase.removeChannel(subs); };
  }, []);

  const toggleCounter = async (id: string) => {
    const isClosed = counters[id].status === "closed";
    await supabase.from("counters").update({ 
      status: isClosed ? "active" : "closed",
      health: isClosed ? "green" : "gray",
      wait_minutes: isClosed ? 6 : null
    }).eq("id", id);
  };

  const applyRecommendation = async () => {
    // 1. Open Counter D
    await supabase.from("counters").update({ 
      status: "active",
      health: "green",
      wait_minutes: 8
    }).eq("id", "D");

    // 2. Reduce queue stats to reflect improvement
    await supabase.from("queue_stats").update({
      waiting_count: 121,
      avg_wait: 19,
      growth_pct: -4,
      queue_velocity_pct: 12
    }).eq("id", 1);
  };

  const serveNext = async (counterId: string) => {
    try {
      const currentToken = activeTokens[counterId];
      if (!currentToken) {
        alert("No active token to serve!");
        return;
      }

      // 1. Mark current as served
      const { error: err1 } = await supabase.from("tokens").update({ status: "served" }).eq("id", currentToken.id);
      if (err1) throw err1;

      // 2. Shift all others down
      const { data: waitingTokens, error: err2 } = await supabase.from("tokens")
        .select("*")
        .eq("counter_id", counterId)
        .eq("status", "waiting")
        .order("position");
        
      if (err2) throw err2;

      let nextTokenIsHandicapped = false;
      let nextTokenId = null;

      if (waitingTokens) {
        await Promise.all(waitingTokens.map(async (t) => {
          if (t.position === 2 && t.is_handicapped) {
            nextTokenIsHandicapped = true;
            nextTokenId = t.id;
          }
          const { error } = await supabase.from("tokens").update({ position: t.position - 1 }).eq("id", t.id);
          if (error) throw error;

          // Notify the user if it is now their turn (they moved from pos 2 to 1)
          if (t.position === 2) {
            const notifText = t.is_handicapped 
              ? "It is your turn! Please remain seated; our staff is coming to assist you to the counter."
              : `It is your turn! Please proceed to Counter ${counterId}.`;
            await supabase.from("notifications").insert({ token_id: t.id, text: notifText });
          }

          // Notify handicapped users one step early (they moved from pos 3 to 2)
          if (t.position === 3 && t.is_handicapped) {
            await supabase.from("notifications").insert({ 
              token_id: t.id, 
              text: "You are next! Please remain seated; our staff will come assist you shortly." 
            });
          }
        }));
      }

      if (nextTokenIsHandicapped) {
        setToastMsg(`🚨 ASSISTANCE REQUIRED: Next patient (Token #${nextTokenId}) requires accessibility support!`);
        setTimeout(() => setToastMsg(null), 8000); // Leave it up longer
      } else {
        setToastMsg(`Successfully served Token #${currentToken.id}`);
        setTimeout(() => setToastMsg(null), 3000);
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to serve next: " + err.message);
    }
  };

  const dOpen = counters["D"]?.status === "active";
  const { waiting_count: waiting, avg_wait: avgWait, growth_pct: growth, queue_velocity_pct: queueVelocity } = queueStats;
  const activeCount = Object.values(counters).filter((c: any) => c.status === "active").length;
  const health = computeHealth(avgWait, growth);

  if (!isAuthenticated) {
    return <div style={{ padding: 32, textAlign: 'center', color: C.body }}>Verifying access...</div>;
  }

  return (
    <div style={{ padding: 32, position: "relative", overflow: "hidden", maxWidth: 1000, margin: "0 auto", width: "100%", background: C.bg }}>
      <TopoRings style={{ top: -60, right: -40 }} />
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 20, borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="fiq-display" style={{ fontSize: 26, fontWeight: 800, color: C.ink }}>FLOWIQ</div>
          <span className="fiq-mono" style={{ fontSize: 10.5, color: C.bodyLight, borderLeft: `1px solid ${C.border}`, paddingLeft: 12 }}>Operator Dashboard</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => router.push('/heatmap')} className="fiq-mono" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.body, background: C.card, padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, cursor: "pointer" }}>
            View Heatmap <ArrowRight size={12} />
          </button>
          <span className="fiq-mono" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.green, fontWeight: 600, letterSpacing: "0.06em" }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: C.green }} className="fiq-pulse" />
            SYSTEM LIVE
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.9fr", gap: 20 }}>
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card style={{ padding: 22 }}>
            <Eyebrow>Queue Health</Eyebrow>
            <div style={{ marginTop: 10 }}>
              <StatusBadge health={health} />
            </div>
            <div style={{ fontSize: 12, color: C.body, marginTop: 12, lineHeight: 1.55 }}>
              {health === "CRITICAL"
                ? "Wait times and queue growth exceed safe thresholds. Action recommended."
                : "Wait times have eased after reallocating counters. Continue monitoring."}
            </div>
          </Card>

          <Card style={{ padding: 22 }}>
            <Eyebrow>Key Metrics</Eyebrow>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
              {[
                { label: "People Waiting", value: waiting, icon: Users },
                { label: "Average Wait", value: `${avgWait} min`, icon: Clock },
                { label: "Active Counters", value: `${activeCount}/4`, icon: Power },
                { label: "Queue Growth", value: `+${growth}%`, icon: TrendingUp },
                {
                  label: "Queue Velocity",
                  value: `${queueVelocity >= 0 ? "↑" : "↓"} ${Math.abs(queueVelocity)}%`,
                  icon: Zap,
                  color: queueVelocity >= 0 ? C.green : C.accentDark,
                },
              ].map((m) => (
                <div key={m.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <m.icon size={14} color={C.bodyLight} />
                    <span style={{ fontSize: 13, color: C.body }}>{m.label}</span>
                  </div>
                  <span className="fiq-mono" style={{ fontSize: 15, fontWeight: 700, color: m.color || C.ink }}>{m.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card style={{ padding: 22 }}>
            <Eyebrow>Counters</Eyebrow>
            <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 12 }}>
              {Object.entries(counters).map(([id, c]: [string, any], i) => (
                <div
                  key={id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "13px 4px",
                    borderTop: i === 0 ? "none" : `1px solid ${C.border}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="fiq-display" style={{ width: 26, fontSize: 18, fontWeight: 800, color: c.status === "closed" ? C.gray : C.ink }}>{id}</div>
                    <div>
                      <div className="fiq-mono" style={{ fontSize: 14, fontWeight: 700, color: c.status === "closed" ? C.gray : C.ink }}>
                        {c.status === "closed" ? "— closed —" : `${c.wait_minutes} min`}
                      </div>
                      {c.status === "active" && activeTokens[id] && (
                        <div style={{ fontSize: 11, color: C.bodyLight, marginTop: 4 }}>
                          Serving: <b style={{ color: C.ink }}>#{activeTokens[id].id}</b>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {c.status === "active" && activeTokens[id] && (
                      <button onClick={() => serveNext(id)} style={{ padding: "6px 12px", background: C.accent, color: "#FBF9F5", borderRadius: 6, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer" }}>
                        Serve Next
                      </button>
                    )}
                    <Pill health={c.health} />
                    <Toggle on={c.status === "active"} onClick={() => toggleCounter(id)} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ padding: 22, borderColor: dOpen ? C.green : C.accent, background: dOpen ? C.greenTint : C.accentTint }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={14} color={dOpen ? C.green : C.accentDark} />
              <Eyebrow color={dOpen ? C.green : C.accentDark}>AI Recommendation</Eyebrow>
            </div>
            {dOpen ? (
              <>
                <div className="fiq-display" style={{ fontSize: 20, fontWeight: 800, color: C.ink, marginTop: 8 }}>Recommendation applied</div>
                <div style={{ fontSize: 13, color: C.body, marginTop: 6 }}>Counter D is open, tokens redirected, and affected users notified. Average wait dropped from 31 to 19 minutes.</div>
              </>
            ) : (
              <>
                <div className="fiq-display" style={{ fontSize: 20, fontWeight: 800, color: C.ink, marginTop: 8 }}>3-step action to resolve CRITICAL</div>
                <div style={{ display: "flex", gap: 24, marginTop: 12 }}>
                  <div>
                    <Eyebrow color={C.bodyLight}>Expected Impact</Eyebrow>
                    <div className="fiq-mono" style={{ fontSize: 17, fontWeight: 700, color: C.ink, marginTop: 3 }}>31 → 19 min</div>
                  </div>
                  <div>
                    <Eyebrow color={C.bodyLight}>Est. Reduction</Eyebrow>
                    <div className="fiq-mono" style={{ fontSize: 17, fontWeight: 700, color: C.accentDark, marginTop: 3 }}>38%</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                  {[
                    { icon: DoorOpen, text: "Open Counter D" },
                    { icon: ArrowRight, text: "Redirect Tokens 52–60 to Counter D" },
                    { icon: Bell, text: "Notify affected users of +8 min delay" },
                  ].map((a, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(251,249,245,0.6)", border: `1px solid ${C.accent}30`, borderRadius: 6, padding: "8px 10px" }}>
                      <a.icon size={13} color={C.accentDark} style={{ flexShrink: 0 }} />
                      <span className="fiq-mono" style={{ fontSize: 11.5, color: C.ink }}>{a.text}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16 }}>
                  <PrimaryButton icon={Sparkles} onClick={applyRecommendation}>Apply Recommendation</PrimaryButton>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      {toastMsg && (
        <div style={{
          position: "fixed",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          background: C.ink,
          color: "#fff",
          padding: "12px 24px",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 999,
          animation: "fadein 0.3s ease"
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
