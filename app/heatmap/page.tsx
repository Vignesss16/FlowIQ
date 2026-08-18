"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, User } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { C, HEALTH_COLOR, HEALTH_TINT } from "@/components/ui/theme";
import { Eyebrow, Pill, Card, MobileHeader } from "@/components/ui/primitives";
import { MobileLayout } from "@/components/MobileLayout";

function HeatBlock({ id, health, wait, dots, closed }: { id: string, health: string, wait: number | null, dots: number, closed: boolean }) {
  const color = HEALTH_COLOR[health as keyof typeof HEALTH_COLOR] || C.gray;
  const tint = HEALTH_TINT[health as keyof typeof HEALTH_TINT] || C.grayTint;
  
  return (
    <div style={{ border: `1px solid ${color}55`, background: tint, borderRadius: 10, padding: "14px 12px", position: "relative", minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
        <div className="fiq-display" style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>Counter {id}</div>
        <Pill health={health} size="sm" />
      </div>
      <div>
        <div className="fiq-mono" style={{ fontSize: 13, color: C.body, fontWeight: 600 }}>{closed ? "Not in service" : `${wait} min wait`}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 9 }}>
          {Array.from({ length: dots }).map((_, i) => (
            <User
              key={i}
              size={13}
              color={color}
              fill={color}
              strokeWidth={0}
              className={health === "red" ? "fiq-pulse" : ""}
              style={{ animationDelay: `${i * 0.12}s`, opacity: 0.85 }}
            />
          ))}
          {dots === 0 && !closed && (
            <span className="fiq-mono" style={{ fontSize: 10.5, color: C.bodyLight }}>No one waiting</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HeatmapScreen() {
  const [counters, setCounters] = useState<Record<string, any>>({
    A: { health: 'green', wait_minutes: 8, status: 'active' },
    B: { health: 'red', wait_minutes: 31, status: 'active' },
    C: { health: 'amber', wait_minutes: 14, status: 'active' },
    D: { health: 'gray', wait_minutes: null, status: 'closed' }
  });

  const fetchCounters = async () => {
    const { data } = await supabase.from("counters").select("*").order("id");
    if (data) {
      const cObj = data.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
      setCounters(cObj);
    }
  };

  useEffect(() => {
    fetchCounters();

    const sub = supabase.channel('heatmap-counters')
      .on("postgres_changes", { event: "*", schema: "public", table: "counters" }, () => fetchCounters())
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const dotsFor = (h: string) => (h === "red" ? 9 : h === "amber" ? 5 : h === "green" ? 2 : 0);

  // Determine best option dynamically
  const activeCounters = Object.values(counters).filter(c => c.status === 'active' && c.wait_minutes !== null);
  activeCounters.sort((a, b) => a.wait_minutes - b.wait_minutes);
  const bestOption = activeCounters[0];
  
  // Determine densest
  const sortedByWaitDesc = [...activeCounters].sort((a, b) => b.wait_minutes - a.wait_minutes);
  const densest = sortedByWaitDesc[0];

  return (
    <MobileLayout showNav={true}>
      <MobileHeader title="Crowd Heatmap" />
      <div style={{ padding: 20 }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          {[["green", "Low"], ["amber", "Medium"], ["red", "High"], ["gray", "Closed"]].map(([h, l]) => (
            <div key={h} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: h === "green" ? C.green : h === "amber" ? C.amber : h === "red" ? C.red : C.gray }} />
              <span className="fiq-mono" style={{ fontSize: 11, color: C.body }}>{l}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card style={{ padding: 20 }}>
          <div style={{ textAlign: "center" }}>
            <span className="fiq-mono" style={{ fontSize: 10.5, letterSpacing: "0.2em", color: C.bodyLight }}>ENTRANCE</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
            {['A', 'B', 'C', 'D'].map(id => {
              const c = counters[id] || { health: 'gray', wait_minutes: null, status: 'closed' };
              return (
                <HeatBlock key={id} id={id} health={c.health} wait={c.wait_minutes} dots={dotsFor(c.health)} closed={c.status === "closed"} />
              );
            })}
          </div>
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <span className="fiq-mono" style={{ fontSize: 10.5, letterSpacing: "0.2em", color: C.bodyLight }}>EXIT</span>
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {bestOption && (
            <Card style={{ padding: "16px 18px", background: C.accentTint, borderColor: C.accent }}>
              <div className="fiq-mono" style={{ fontSize: 11, fontWeight: 700, color: C.accentDark, letterSpacing: "0.04em" }}>
                💡 BEST OPTION: COUNTER {bestOption.id}
              </div>
              <div style={{ fontSize: 12, color: C.body, marginTop: 4, lineHeight: 1.45 }}>
                Lowest density, shortest wait among active counters right now.
              </div>
            </Card>
          )}
          <Card style={{ padding: 20 }}>
            <Eyebrow>Densest Zone</Eyebrow>
            <div className="fiq-display" style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginTop: 6 }}>
              {densest ? `Counter ${densest.id}` : "None critical"}
            </div>
            <div style={{ fontSize: 12.5, color: C.body, marginTop: 6, lineHeight: 1.5 }}>
              Crowd density is estimated from live queue length per counter, not computer vision, for this prototype.
            </div>
          </Card>
          {bestOption && (
            <Card style={{ padding: 20 }}>
              <Eyebrow>Recommended Path</Eyebrow>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <MapPin size={14} color={C.green} />
                <span className="fiq-mono" style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Route to Counter {bestOption.id}</span>
              </div>
              <div style={{ fontSize: 12.5, color: C.body, marginTop: 6, lineHeight: 1.5 }}>
                Lowest density and shortest predicted wait among active counters.
              </div>
            </Card>
          )}
        </div>
      </div>
      </div>
    </MobileLayout>
  );
}
