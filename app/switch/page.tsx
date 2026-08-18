"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Zap, CheckCircle2, RotateCcw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { C } from "@/components/ui/theme";
import { Eyebrow, Card, PrimaryButton, SecondaryButton, MobileHeader } from "@/components/ui/primitives";
import { MobileLayout } from "@/components/MobileLayout";

function SwitchContent() {
  const searchParams = useSearchParams();
  const [tokenId, setTokenId] = useState<string | null>(null);

  useEffect(() => {
    const pToken = searchParams.get("tokenId");
    if (pToken) {
      localStorage.setItem("fiq_token", pToken);
      setTokenId(pToken);
    } else {
      setTokenId(localStorage.getItem("fiq_token"));
    }
  }, [searchParams]);

  const [state, setState] = useState("prompt"); // prompt | switched | stayed
  const [tokenData, setTokenData] = useState<any>(null);
  const [counters, setCounters] = useState<any[]>([]);

  useEffect(() => {
    if (!tokenId) return;

    const fetchAll = async () => {
      const [{ data: token }, { data: ctrs }] = await Promise.all([
        supabase.from("tokens").select("*").eq("id", tokenId).single(),
        supabase.from("counters").select("*").order("id")
      ]);
      if (token) setTokenData(token);
      if (ctrs) setCounters(ctrs);
    };

    fetchAll();
  }, [tokenId]);

  const handleSwitch = async () => {
    if (!tokenData || tokenData.switch_used) return;
    
    // Find best counter
    const active = counters.filter(c => c.status === 'active');
    active.sort((a, b) => a.wait_minutes - b.wait_minutes);
    const best = active[0];
    
    if (best) {
      await supabase.rpc('switch_queue', { target_token_id: parseInt(tokenId!), new_counter_id_val: best.id });
      // Fetch updated token
      const { data } = await supabase.from("tokens").select("*").eq("id", tokenId).single();
      if (data) setTokenData(data);
      setState("switched");
    }
  };

  const currentCounter = counters.find(c => c.id === tokenData?.counter_id) || { id: 'B', wait_minutes: 31 };
  
  // Best alternative
  const active = counters.filter(c => c.status === 'active' && c.id !== currentCounter.id);
  active.sort((a, b) => a.wait_minutes - b.wait_minutes);
  const altCounter = active[0] || { id: 'A', wait_minutes: 11 };
  
  const timeSaved = currentCounter.wait_minutes - altCounter.wait_minutes;
  const isFaster = timeSaved > 0;

  return (
    <MobileLayout showNav={true}>
      <MobileHeader title="Switch Queue" />
      <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
        {/* dimmed dashboard behind */}
        <div style={{ padding: "18px 20px", opacity: 0.35, filter: "blur(0.3px)" }}>
          <div className="fiq-display" style={{ fontSize: 20, fontWeight: 800, color: C.ink }}>FLOWIQ</div>
          <Eyebrow>Your Token</Eyebrow>
          <div className="fiq-display" style={{ fontSize: 60, color: C.ink, fontWeight: 800 }}>#{tokenData?.id || 82}</div>
          <Card style={{ marginTop: 14, padding: "14px 16px" }}>
            <Eyebrow color={C.bodyLight}>Current Queue — Counter {currentCounter.id}</Eyebrow>
            <div className="fiq-display fiq-mono" style={{ fontSize: 30, color: C.ink, fontWeight: 700, marginTop: 4 }}>{currentCounter.wait_minutes} min</div>
          </Card>
        </div>

        {/* overlay */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(26,25,23,0.28)", display: "flex", alignItems: "flex-end" }}>
          <div style={{ width: "100%", background: C.card, borderTop: `1px solid ${C.border}`, borderRadius: "18px 18px 0 0", padding: "22px 22px 26px", boxSizing: "border-box" }}>
            {state === "prompt" && (
              isFaster ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accentTint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Zap size={15} color={C.accent} strokeWidth={2.2} />
                      </div>
                      <div className="fiq-display" style={{ fontSize: 19, fontWeight: 800, color: C.ink }}>Faster Queue Detected</div>
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                      <Card style={{ flex: 1, padding: "12px 14px" }}>
                        <Eyebrow color={C.bodyLight}>Counter {altCounter.id}</Eyebrow>
                        <div className="fiq-display fiq-mono" style={{ fontSize: 26, color: C.green, fontWeight: 700, marginTop: 3 }}>{altCounter.wait_minutes} min</div>
                      </Card>
                      <Card style={{ flex: 1, padding: "12px 14px", background: C.accentTint, borderColor: C.accent }}>
                        <Eyebrow color={C.accentDark}>Time Saved</Eyebrow>
                        <div className="fiq-display fiq-mono" style={{ fontSize: 26, color: C.accentDark, fontWeight: 700, marginTop: 3 }}>{timeSaved} min</div>
                      </Card>
                    </div>

                    <div style={{ fontSize: 12.5, color: C.body, marginTop: 12, lineHeight: 1.5 }}>
                      FlowIQ found a counter that will get you served significantly sooner. You may switch once per token.
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
                      <PrimaryButton full icon={Zap} onClick={handleSwitch} disabled={tokenData?.switch_used}>Switch Queue</PrimaryButton>
                      <SecondaryButton full onClick={() => setState("stayed")}>Stay on Counter {currentCounter.id}</SecondaryButton>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: C.greenTint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CheckCircle2 size={15} color={C.green} strokeWidth={2.2} />
                      </div>
                      <div className="fiq-display" style={{ fontSize: 19, fontWeight: 800, color: C.ink }}>Fastest Queue!</div>
                    </div>
                    <div style={{ fontSize: 12.5, color: C.body, marginTop: 12, lineHeight: 1.5 }}>
                      You are already in the fastest queue available. No switch is recommended at this time.
                    </div>
                  </>
                )
            )}

            {state === "switched" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: C.greenTint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle2 size={15} color={C.green} strokeWidth={2.2} />
                  </div>
                  <div className="fiq-display" style={{ fontSize: 19, fontWeight: 800, color: C.ink }}>Switched to Counter {tokenData?.counter_id}</div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <Card style={{ flex: 1, padding: "12px 14px" }}>
                    <Eyebrow color={C.bodyLight}>New Position</Eyebrow>
                    <div className="fiq-display" style={{ fontSize: 26, color: C.ink, fontWeight: 700, marginTop: 3 }}>{tokenData?.position}</div>
                  </Card>
                  <Card style={{ flex: 1, padding: "12px 14px" }}>
                    <Eyebrow color={C.bodyLight}>Estimated Wait</Eyebrow>
                    <div className="fiq-display fiq-mono" style={{ fontSize: 26, color: C.green, fontWeight: 700, marginTop: 3 }}>{altCounter.wait_minutes} min</div>
                  </Card>
                </div>
                <div className="fiq-mono" style={{ fontSize: 12, color: C.accentDark, marginTop: 12, background: C.accentTint, border: `1px solid ${C.accent}40`, borderRadius: 8, padding: "10px 12px" }}>
                  You saved approximately {timeSaved} minutes.
                </div>
                <button onClick={() => setState("prompt")} className="fiq-mono" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16, fontSize: 11, color: C.bodyLight, background: "none", border: "none", cursor: "pointer" }}>

                </button>
              </>
            )}

            {state === "stayed" && (
              <>
                <div className="fiq-display" style={{ fontSize: 19, fontWeight: 800, color: C.ink }}>Staying on Counter {currentCounter.id}</div>
                <div style={{ fontSize: 12.5, color: C.body, marginTop: 8, lineHeight: 1.5 }}>
                  No problem — you'll keep your place in Counter {currentCounter.id}'s queue. We'll keep watching for a faster option.
                </div>
                <button onClick={() => setState("prompt")} className="fiq-mono" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16, fontSize: 11, color: C.bodyLight, background: "none", border: "none", cursor: "pointer" }}>

                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}

export default function SwitchModalScreen() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SwitchContent />
    </Suspense>
  );
}
