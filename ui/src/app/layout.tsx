import type { Metadata } from "next";
import { Suspense } from "react";
import { Nav } from "@/components/Nav";
import { Tour } from "@/components/Tour";
import "./globals.css";

export const metadata: Metadata = {
  title: "Career-Ops",
  description: "Find the few jobs worth your time.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Suspense fallback={null}>
          <Tour />
        </Suspense>
        <footer
          style={{
            padding: "32px var(--gutter)",
            borderTop: "1px solid var(--surface-hairline)",
            color: "var(--fg-subtle)",
            fontSize: "12px",
          }}
        >
          <div className="container flex items-center justify-between">
            <span>Career-Ops · runs locally · your data stays on your laptop</span>
            <span>v1</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
