import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
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
