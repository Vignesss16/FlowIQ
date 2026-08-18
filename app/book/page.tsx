"use client";

import React, { useState, useEffect } from "react";
import { Zap, Calendar, Ticket, ArrowRight, RotateCcw, CheckCircle2, BellRing, Radio } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { C } from "@/components/ui/theme";
import { MobileHeader, Eyebrow, Card, PrimaryButton, LoadBadge } from "@/components/ui/primitives";
import { MobileLayout } from "@/components/MobileLayout";

type Slot = {
  id: string;
  label: string;
  load: string;
  start_time: string | null;
};

export default function BookAppointmentScreen() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState("walkin");
  const [step, setStep] = useState("booking"); // booking | confirming | confirmed
  const [notified, setNotified] = useState(false);
  
  const [tokenData, setTokenData] = useState<{ id: number; position: number; wait_est: number } | null>(null);
  const [isHandicapped, setIsHandicapped] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/auth?type=user&redirect=/book');
      } else {
        setIsAuthenticated(true);
      }
    };
    checkAuth();

    const fetchSlots = async () => {
      const { data } = await supabase.from("slots").select("*").order("start_time", { ascending: true, nullsFirst: true });
      if (data) setSlots(data);
    };
    fetchSlots();
  }, []);

  const handleBook = async () => {
    setStep("confirming");
    
    // Simulate some logic to determine position and wait
    const { data: qStats } = await supabase.from("queue_stats").select("*").single();
    const position = (qStats?.waiting_count || 47) + 1;
    const wait_est = (qStats?.avg_wait || 31) - 5; // dummy logic for est
    
    // Insert token
    // Fetch active counters and find the fastest one
    const { data: counters } = await supabase.from('counters').select('*').eq('status', 'active');
    let assignedCounter = 'A'; // Fallback
    if (counters && counters.length > 0) {
      const fastest = counters.reduce((prev, curr) => (prev.wait_minutes < curr.wait_minutes ? prev : curr));
      assignedCounter = fastest.id;
    }

    const { data, error } = await supabase.from("tokens").insert({
      slot_id: selected,
      counter_id: assignedCounter,
      position,
      is_handicapped: isHandicapped,
      status: "waiting",
    }).select().single();
    
    if (data) {
      setTokenData({ id: data.id, position, wait_est });
      
      // Notify
      await supabase.from("notifications").insert({
        token_id: data.id,
        text: `Token #${data.id} confirmed. Wait time is live.`
      });
    }

    setTimeout(() => setStep("confirmed"), 900);
    setTimeout(() => setNotified(true), 1500);
  };

  if (step === "confirming") {
    return (
      <MobileLayout>
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <MobileHeader right={<Radio size={16} color={C.body} />} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <div className="fiq-pulse" style={{ width: 44, height: 44, borderRadius: 999, background: C.accentTint, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ticket size={20} color={C.accent} strokeWidth={2} />
            </div>
            <span className="fiq-mono" style={{ fontSize: 11.5, letterSpacing: "0.1em", color: C.bodyLight, textTransform: "uppercase" }}>
              Generating your digital token…
            </span>
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (step === "confirmed" && tokenData) {
    return (
      <MobileLayout>
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <MobileHeader right={<Radio size={16} color={C.body} />} />

          {notified && (
            <div style={{ margin: "12px 20px 0", padding: "10px 12px", borderRadius: 8, background: C.ink, display: "flex", alignItems: "center", gap: 10 }} className="fiq-toast-in">
              <BellRing size={14} color="#FBF9F5" style={{ flexShrink: 0 }} />
              <span className="fiq-mono" style={{ fontSize: 11, color: "#FBF9F5", lineHeight: 1.4 }}>
                Notification sent — token confirmed & wait time is live.
              </span>
            </div>
          )}

          <div style={{ padding: "20px 20px 8px", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: C.greenTint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 size={15} color={C.green} strokeWidth={2.2} />
              </div>
              <div className="fiq-display" style={{ fontSize: 19, fontWeight: 800, color: C.ink }}>Appointment Booked</div>
            </div>

            <Card style={{ marginTop: 16, padding: "20px 18px", textAlign: "center" }}>
              <Eyebrow color={C.bodyLight}>Your Digital Token</Eyebrow>
              <div className="fiq-display" style={{ fontSize: 60, lineHeight: 1.05, color: C.ink, fontWeight: 800, marginTop: 4 }}>#{tokenData.id}</div>
              <div className="fiq-mono" style={{ fontSize: 11.5, color: C.bodyLight, marginTop: 4 }}>
                {slots.find((s) => s.id === selected)?.label || selected}
              </div>
            </Card>

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <Card style={{ flex: 1, padding: "12px 14px" }}>
                <Eyebrow color={C.bodyLight}>Position</Eyebrow>
                <div className="fiq-display" style={{ fontSize: 22, color: C.ink, fontWeight: 700, marginTop: 3 }}>
                  {tokenData.position}{tokenData.position % 10 === 1 && tokenData.position !== 11 ? 'st' : tokenData.position % 10 === 2 && tokenData.position !== 12 ? 'nd' : tokenData.position % 10 === 3 && tokenData.position !== 13 ? 'rd' : 'th'}
                </div>
              </Card>
              <Card style={{ flex: 1, padding: "12px 14px" }}>
                <Eyebrow color={C.bodyLight}>Est. Wait</Eyebrow>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                  <div className="fiq-display fiq-mono" style={{ fontSize: 22, color: C.ink, fontWeight: 700, marginTop: 3 }}>{tokenData.wait_est} min</div>
                  <span className="fiq-mono" style={{ fontSize: 10.5, color: C.bodyLight, fontWeight: 600 }}>± 5</span>
                </div>
              </Card>
            </div>

            <div style={{ fontSize: 12.5, color: C.body, marginTop: 14, lineHeight: 1.5 }}>
              You don't need to wait here. Leave freely — FlowIQ tracks the queue and will alert you as your turn approaches.
            </div>
          </div>

          <div style={{ padding: "16px 20px 22px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
            <PrimaryButton full icon={ArrowRight} onClick={() => router.push(`/dashboard?tokenId=${tokenData.id}`)}>
              View Live Queue Status
            </PrimaryButton>
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <MobileLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.body }}>
          Verifying account...
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <MobileHeader right={<Radio size={16} color={C.body} />} />
        <div style={{ padding: "22px 20px 8px" }}>
          <Eyebrow>Book Your Spot</Eyebrow>
          <div className="fiq-display" style={{ fontSize: 30, lineHeight: 1.08, marginTop: 6, color: C.ink, fontWeight: 800 }}>
            When would you<br />like to arrive?
          </div>
          <div style={{ fontSize: 13.5, color: C.body, marginTop: 8, lineHeight: 1.5 }}>
            Pick a slot and get a digital token instantly — no physical waiting required.
          </div>
        </div>

        <div style={{ padding: "10px 20px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
          {slots.map((s) => {
            const active = selected === s.id;
            const Icon = s.id === 'walkin' ? Zap : Calendar;
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  textAlign: "left",
                  padding: "15px 16px",
                  borderRadius: 10,
                  border: `1px solid ${active ? C.accent : C.border}`,
                  background: active ? C.accentTint : C.card,
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 8, background: active ? C.accent : C.grayTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={17} color={active ? "#FBF9F5" : C.body} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: C.ink }}>{s.label}</div>
                  <div className="fiq-mono" style={{ fontSize: 11, color: C.bodyLight, marginTop: 2 }}>{s.start_time ? 'Scheduled Slot' : 'Join the live queue immediately'}</div>
                </div>
                <LoadBadge load={s.load} />
              </button>
            );
          })}
          <div style={{ fontSize: 11.5, color: C.bodyLight, marginTop: 2, lineHeight: 1.5 }}>
            Crowd load is estimated live from current bookings, so choosing a lighter slot helps spread demand automatically.
          </div>
        </div>

        <div style={{ padding: "0 20px 16px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input 
              type="checkbox" 
              checked={isHandicapped} 
              onChange={(e) => setIsHandicapped(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: C.accent }} 
            />
            <span style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>I require Accessibility Assistance</span>
          </label>
          <div style={{ fontSize: 11.5, color: C.bodyLight, marginTop: 4, paddingLeft: 28, lineHeight: 1.4 }}>
            Select this to use our dedicated accessible waiting area. We'll notify you when it's time to approach the counter.
          </div>
        </div>

        <div style={{ padding: "16px 20px 22px", borderTop: `1px solid ${C.border}` }}>
          <PrimaryButton full icon={Ticket} onClick={handleBook}>Book & Get Digital Token</PrimaryButton>
        </div>
      </div>
    </MobileLayout>
  );
}
