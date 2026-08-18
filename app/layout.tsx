import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowIQ",
  description: "AI-powered queue and crowd management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
