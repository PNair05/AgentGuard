import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentGuard — Trust and authorization for WebMCP",
  description:
    "A trust, authorization, privacy, approval, verification, and audit layer for consequential WebMCP actions."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
