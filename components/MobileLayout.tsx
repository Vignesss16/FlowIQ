"use client";
import React, { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutDashboard, Zap, Map, User } from "lucide-react";
import { C } from "./ui/theme";

function MobileLayoutInner({ children, showNav }: { children: React.ReactNode, showNav: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tokenId = searchParams.get("tokenId") || "";

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: `/dashboard${tokenId ? `?tokenId=${tokenId}` : ''}` },
    { label: "Switch", icon: Zap, path: `/switch${tokenId ? `?tokenId=${tokenId}` : ''}` },
    { label: "Heatmap", icon: Map, path: `/heatmap` },
    { label: "Profile", icon: User, path: `/profile` },
  ];

  return (
    <div style={{ 
      maxWidth: 480, 
      width: "100%",
      margin: "0 auto", 
      background: C.bg, 
      minHeight: "100vh",
      boxShadow: "0 0 40px rgba(0,0,0,0.1)",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", paddingBottom: showNav ? 70 : 0 }} className="no-scrollbar">
        {children}
      </div>
      
      {showNav && (
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 70,
          background: C.card,
          borderTop: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          paddingBottom: 10
        }}>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.path.split('?')[0]);
            return (
              <button
                key={item.label}
                onClick={() => router.push(item.path)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: isActive ? C.accent : C.bodyLight
                }}
              >
                <item.icon size={22} color={isActive ? C.accent : C.bodyLight} strokeWidth={isActive ? 2.5 : 2} />
                <span className="fiq-mono" style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function MobileLayout({ children, showNav = false }: { children: React.ReactNode, showNav?: boolean }) {
  return (
    <Suspense fallback={
      <div style={{ maxWidth: 480, margin: "0 auto", background: C.bg, minHeight: "100vh" }} />
    }>
      <MobileLayoutInner showNav={showNav}>
        {children}
      </MobileLayoutInner>
    </Suspense>
  );
}
