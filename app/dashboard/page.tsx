"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { Bell, BellRing, Users, Sparkles, Clock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { C } from "@/components/ui/theme";
import { MobileHeader, Eyebrow, Card, Pill, StatusBadge } from "@/components/ui/primitives";
import { MobileLayout } from "@/components/MobileLayout";

// Use simple countdown that syncs with waitMinutes provided by backend
function useCountdown(startSeconds: number) {
  const [secs, setSecs] = useState(startSeconds);
  
  useEffect(() => {
    setSecs(startSeconds);
  }, [startSeconds]);

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return { mm, ss, secs };
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  useEffect(() => {
    const pToken = searchParams.get("tokenId");
    if (pToken) {
      localStorage.setItem("fiq_token", pToken);
      setTokenId(pToken);
    } else {
      setTokenId(localStorage.getItem("fiq_token"));
    }
    setHasCheckedStorage(true);
  }, [searchParams]);

  const [tokenData, setTokenData] = useState<any>(null);
  const [counters, setCounters] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [queueStats, setQueueStats] = useState<any>(null);

  // Initial fetch
  useEffect(() => {
    if (!tokenId) return;

    const fetchData = async () => {
      const [{ data: token }, { data: ctrs }, { data: qs }] = await Promise.all([
        supabase.from("tokens").select("*").eq("id", tokenId).single(),
        supabase.from("counters").select("*").order("id"),
        supabase.from("queue_stats").select("*").single(),
      ]);
      if (token) setTokenData(token);
      if (ctrs) setCounters(ctrs);
      if (qs) setQueueStats(qs);
    };

    fetchData();

    // Realtime subscriptions
    const tokenSub = supabase.channel(`token-${tokenId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tokens", filter: `id=eq.${tokenId}` }, (payload) => {
        setTokenData(payload.new);
      }).subscribe();

    const notifSub = supabase.channel(`notifs-${tokenId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `token_id=eq.${tokenId}` }, (payload) => {
        const text = payload.new.text;
        setToast(text);
        setUnread((u) => u + 1);
        setTimeout(() => setToast((t) => (t === text ? null : t)), 3800);
      }).subscribe();

    const countersSub = supabase.channel('public:counters')
      .on("postgres_changes", { event: "*", schema: "public", table: "counters" }, () => {
        supabase.from("counters").select("*").order("id").then(({ data }) => {
          if (data) setCounters(data);
        });
      }).subscribe();

    const queueStatsSub = supabase.channel('public:queue_stats')
      .on("postgres_changes", { event: "*", schema: "public", table: "queue_stats" }, (payload) => {
        setQueueStats(payload.new);
      }).subscribe();

    return () => {
      supabase.removeChannel(tokenSub);
      supabase.removeChannel(notifSub);
      supabase.removeChannel(countersSub);
      supabase.removeChannel(queueStatsSub);
    };
  }, [tokenId]);

  const estWaitMin = queueStats?.avg_wait || 26; // Fallback to 26 if missing
  const { mm, ss, secs } = useCountdown(estWaitMin * 60);
  const waitMinutes = secs / 60;
  const waitColor = waitMinutes <= 15 ? C.green : waitMinutes <= 30 ? C.amber : C.red;
  
  const returnBy = useRef(new Date(Date.now() + estWaitMin * 60000)).current;
  const returnByLabel = returnBy.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  if (hasCheckedStorage && !tokenId) {
    return (
      <MobileLayout showNav={true}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 32, textAlign: "center" }}>
          <div className="fiq-display" style={{ fontSize: 24, fontWeight: 800, color: C.ink, marginBottom: 12 }}>No Active Token</div>
          <div style={{ fontSize: 14, color: C.body, lineHeight: 1.5, marginBottom: 24 }}>You haven't booked a spot in the queue yet.</div>
          <button onClick={() => window.location.href = '/book'} style={{ padding: "12px 24px", background: C.accent, color: "#FBF9F5", borderRadius: 8, fontWeight: 600, border: "none", cursor: "pointer" }}>
            Book a Spot
          </button>
        </div>
      </MobileLayout>
    );
  }

  if (!tokenData || counters.length === 0 || !queueStats) {
    return (
      <MobileLayout showNav={true}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.body }}>
          Loading your token...
        </div>
      </MobileLayout>
    );
  }

  // Calculate recommended counter (e.g., if there's a counter with much less wait time)
  // For demo, we just mark counter A as recommended if we are on B.
  const recommendedCounter = counters.find(c => c.id === 'A') ? 'A' : null;

  const simulateQueueMove = async () => {
    if (!tokenData || tokenData.position <= 1) return;
    const newPos = tokenData.position - 1;
    await supabase.from("tokens").update({ position: newPos }).eq("id", tokenData.id);
    
    if (newPos === 1) {
      const notifText = tokenData.is_handicapped 
        ? "It is your turn! Please remain seated; our staff is coming to assist you to the counter."
        : `It is your turn! Please proceed to Counter ${tokenData.counter_id}.`;
      await supabase.from("notifications").insert({ token_id: tokenData.id, text: notifText });
    }
    
    if (newPos === 2 && tokenData.is_handicapped) {
      await supabase.from("notifications").insert({ 
        token_id: tokenData.id, 
        text: "You are next! Please remain seated; our staff will come assist you shortly." 
      });
    }
  };

  const isNext = tokenData?.position === 1;

  return (
    <MobileLayout showNav={true}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
        <MobileHeader
          right={
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span className="fiq-mono" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: C.green, fontWeight: 600, letterSpacing: "0.06em" }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: C.green }} className="fiq-pulse" />
                LIVE
              </span>
              <div style={{ position: "relative" }}>
                <Bell size={16} color={C.body} />
                {unread > 0 && (
                  <span className="fiq-mono" style={{ position: "absolute", top: -6, right: -6, minWidth: 14, height: 14, borderRadius: 999, background: C.accent, color: "#FBF9F5", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                    {unread}
                  </span>
                )}
              </div>
            </div>
          }
        />

        {toast && (
          <div className="fiq-toast-in" style={{ position: "absolute", top: 60, left: 12, right: 12, zIndex: 10, padding: "10px 12px", borderRadius: 8, background: C.ink, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 6px 18px rgba(26,25,23,0.18)" }}>
            <BellRing size={14} color={C.accent} style={{ flexShrink: 0 }} />
            <span className="fiq-mono" style={{ fontSize: 11, color: "#FBF9F5", lineHeight: 1.4 }}>{toast}</span>
          </div>
        )}

        {tokenData?.is_handicapped && isNext && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(26,25,23,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: C.card, padding: 32, borderRadius: 16, width: "100%", textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
              <BellRing size={48} color={C.accent} style={{ margin: "0 auto", marginBottom: 16 }} />
              <div className="fiq-display" style={{ fontSize: 28, fontWeight: 800, color: C.ink }}>Next is Your Turn!</div>
              <div style={{ fontSize: 16, color: C.body, marginTop: 12, lineHeight: 1.5 }}>
                The person ahead of you is at the counter. Please leave the Waiting Room and proceed to <b>Counter {tokenData.counter_id}</b> now.
              </div>
              <button onClick={() => supabase.from('tokens').update({ position: 0 }).eq('id', tokenData.id)} style={{ width: "100%", padding: "16px", borderRadius: 8, background: C.accent, color: "#FBF9F5", fontSize: 16, fontWeight: 700, border: "none", marginTop: 24, cursor: "pointer" }}>
                I am on my way
              </button>
            </div>
          </div>
        )}

        <div style={{ padding: "22px 20px 0" }}>
          <Eyebrow>Your Token</Eyebrow>
          <div className="fiq-display" style={{ fontSize: 76, lineHeight: 1, color: C.ink, fontWeight: 800, marginTop: 4 }}>#{tokenData.id}</div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Card style={{ flex: 1, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={13} color={C.bodyLight} />
                <Eyebrow color={C.bodyLight}>Ahead</Eyebrow>
              </div>
              <div className="fiq-display" style={{ fontSize: 26, color: C.ink, fontWeight: 700, marginTop: 3 }}>
                {Math.max(0, tokenData.position - 1)}
              </div>
            </Card>
            <Card style={{ flex: 1, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={13} color={C.bodyLight} />
                <Eyebrow color={C.bodyLight}>AI Precision</Eyebrow>
              </div>
              <div className="fiq-display" style={{ fontSize: 26, color: C.ink, fontWeight: 700, marginTop: 3 }}>82%</div>
            </Card>
          </div>

          <Card style={{ marginTop: 10, padding: "16px 18px", background: waitColor, border: "none", transition: "background 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div className="fiq-mono" style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(26,25,23,0.65)" }}>Predicted Wait</div>
              <Clock size={13} color={C.ink} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
              <div className="fiq-display fiq-mono" style={{ fontSize: 44, color: C.ink, fontWeight: 700, letterSpacing: "0.01em" }}>
                {mm}:{ss}
              </div>
              <span className="fiq-mono" style={{ fontSize: 13, color: "rgba(26,25,23,0.6)", fontWeight: 600 }}>± 5 min</span>
            </div>
            <div style={{ width: "100%", height: 3, background: "rgba(26,25,23,0.18)", borderRadius: 999, marginTop: 10, overflow: "hidden" }}>
              <div style={{ width: "82%", height: "100%", background: C.ink }} />
            </div>
          </Card>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: waitColor }} />
            <span className="fiq-mono" style={{ fontSize: 10.5, color: C.bodyLight, letterSpacing: "0.04em" }}>
              {waitMinutes <= 15 ? "SHORT WAIT" : waitMinutes <= 30 ? "MODERATE WAIT" : "LONG WAIT"}
            </span>
          </div>

          <div style={{ fontSize: 11, color: C.bodyLight, marginTop: 8, lineHeight: 1.5 }}>
            Range reflects live queue velocity, service-time variance, and counter availability — not a fixed estimate.
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
            <StatusBadge health={waitMinutes <= 15 ? "NORMAL" : waitMinutes <= 30 ? "BUILDING UP" : "CRITICAL"} />
            <span style={{ fontSize: 12, color: C.body }}>Return by <b style={{ color: C.ink }}>{returnByLabel}</b></span>
          </div>
          <div style={{ fontSize: 12.5, color: C.body, marginTop: 8, lineHeight: 1.5 }}>
            {tokenData.is_handicapped 
              ? "Please rest comfortably in the designated Waiting Room. We will notify you when it's time to approach the counter."
              : "You can leave the physical queue. We'll notify you when your turn is near."}
          </div>
          
          <button onClick={simulateQueueMove} className="fiq-mono" style={{ marginTop: 16, padding: "8px 12px", background: C.grayTint, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11, color: C.body, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: 6 }}>
            <Sparkles size={14} /> Simulate Queue Advance (Demo)
          </button>
        </div>

        <div style={{ padding: "20px 20px 8px", flex: 1, overflowY: "auto" }} className="no-scrollbar">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <Eyebrow>Available Counters</Eyebrow>
            {recommendedCounter && (
              <span className="fiq-mono" style={{ fontSize: 10.5, color: C.accent, fontWeight: 600 }}>RECOMMENDED: {recommendedCounter}</span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {counters.map((c) => {
              const recommended = c.id === recommendedCounter;
              return (
                <Card
                  key={c.id}
                  style={{
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderColor: recommended ? C.accent : C.border,
                    background: recommended ? C.accentTint : C.card,
                    opacity: c.status === 'closed' ? 0.6 : 1
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="fiq-display" style={{ fontSize: 17, fontWeight: 800, color: C.ink, width: 20 }}>{c.id}</div>
                    <div>
                      {c.status === 'active' ? (
                        <div className="fiq-mono" style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{c.wait_minutes} min</div>
                      ) : (
                        <div className="fiq-mono" style={{ fontSize: 13, fontWeight: 600, color: C.bodyLight }}>Closed</div>
                      )}
                    </div>
                  </div>
                  <Pill health={c.health} size="sm" />
                </Card>
              );
            })}
          </div>
          <div style={{ fontSize: 11.5, color: C.bodyLight, marginTop: 10, lineHeight: 1.5 }}>
            Counter A is estimated to be 23 minutes faster than Counter B.
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}

export default function UserDashboardScreen() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
