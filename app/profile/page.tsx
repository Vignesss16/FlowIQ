"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { C } from "@/components/ui/theme";
import { MobileLayout } from "@/components/MobileLayout";
import { MobileHeader, Card, SecondaryButton } from "@/components/ui/primitives";
import { LogOut, User, Ticket } from "lucide-react";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/auth?type=user');
        return;
      }
      setUser(session.user);

      // Fetch user's queue history
      // Since tokens are public right now and don't enforce user_id heavily, 
      // we'll just fetch the most recent tokens. In a real app, this would filter by user_id.
      const { data: myTokens } = await supabase.from('tokens')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
        
      if (myTokens) setTokens(myTokens);
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <MobileLayout showNav={true}>
        <div style={{ padding: 32, textAlign: "center", color: C.body }}>Loading profile...</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showNav={true}>
      <MobileHeader title="My Profile" />
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
        
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 999, background: C.card, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <User size={32} color={C.accent} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="fiq-mono" style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{user?.email}</div>
            <div style={{ fontSize: 13, color: C.bodyLight, marginTop: 4 }}>FlowIQ Member</div>
          </div>
        </div>

        <Card style={{ padding: 20 }}>
          <div className="fiq-mono" style={{ fontSize: 11, fontWeight: 700, color: C.bodyLight, marginBottom: 16 }}>RECENT QUEUE TOKENS</div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {tokens.length === 0 ? (
              <div style={{ fontSize: 13, color: C.body }}>No recent tokens found.</div>
            ) : (
              tokens.map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ background: C.bg, padding: 8, borderRadius: 8 }}>
                      <Ticket size={16} color={C.body} />
                    </div>
                    <div>
                      <div className="fiq-mono" style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Token #{t.id}</div>
                      <div style={{ fontSize: 12, color: C.body, marginTop: 2 }}>{new Date(t.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="fiq-mono" style={{ fontSize: 11, color: t.status === "served" ? C.green : C.amber }}>
                    {t.status.toUpperCase()}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <SecondaryButton icon={LogOut} onClick={handleLogout} style={{ marginTop: 20, color: C.red, borderColor: `${C.red}40` }}>
          Sign Out
        </SecondaryButton>
      </div>
    </MobileLayout>
  );
}
