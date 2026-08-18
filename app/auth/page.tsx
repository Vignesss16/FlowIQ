"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { C } from "@/components/ui/theme";
import { PrimaryButton, MobileHeader } from "@/components/ui/primitives";
import { MobileLayout } from "@/components/MobileLayout";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isUserType = searchParams.get("type") === "user";
  const redirectPath = searchParams.get("redirect") || (isUserType ? "/dashboard" : "/admin");

  const [isLogin, setIsLogin] = useState(!isUserType); // default to register if user, login if staff
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(redirectPath);
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Signup successful! Signing you in...");
        router.push(redirectPath);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MobileHeader title={isUserType ? "FlowIQ Account" : "Staff Auth"} />
      <div style={{ padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24, flex: 1, justifyContent: "center" }}>
        
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div className="fiq-display" style={{ fontSize: 32, fontWeight: 800, color: C.ink }}>
            {isLogin ? "Welcome Back" : "Create Account"}
          </div>
          <div style={{ fontSize: 14, color: C.body, marginTop: 8 }}>
            {isUserType 
              ? (isLogin ? "Sign in to view your queue." : "Register to book a spot in line.") 
              : (isLogin ? "Sign in to access the operator dashboard." : "Register to manage queues and counters.")
            }
          </div>
        </div>

        {errorMsg && (
          <div className="fiq-mono" style={{ background: C.redTint, color: C.red, padding: "12px 16px", borderRadius: 8, fontSize: 12, border: `1px solid ${C.red}40` }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="fiq-mono" style={{ fontSize: 11, fontWeight: 600, color: C.body }}>EMAIL ADDRESS</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: "14px 16px", borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.card, color: C.ink, fontSize: 16, outline: "none",
                fontFamily: "inherit"
              }}
              placeholder={isUserType ? "you@example.com" : "operator@flowiq.com"}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="fiq-mono" style={{ fontSize: 11, fontWeight: 600, color: C.body }}>PASSWORD</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: "14px 16px", borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.card, color: C.ink, fontSize: 16, outline: "none",
                fontFamily: "inherit"
              }}
              placeholder="••••••••"
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <PrimaryButton full icon={isLogin ? LogIn : KeyRound} disabled={loading}>
              {loading ? "Please wait..." : (isLogin ? "Sign In" : "Register")}
            </PrimaryButton>
          </div>
        </form>

        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="fiq-mono"
            style={{
              background: "none", border: "none", color: C.body,
              fontSize: 12, cursor: "pointer", textDecoration: "underline"
            }}
          >
            {isLogin ? "Need an account? Register" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function AuthPage() {
  return (
    <MobileLayout>
      <Suspense fallback={<div style={{ padding: 32, textAlign: 'center', color: C.body }}>Loading...</div>}>
        <AuthForm />
      </Suspense>
    </MobileLayout>
  );
}
