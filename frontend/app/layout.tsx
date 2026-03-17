import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WPNotes",
  description: "Tu asistente personal inteligente vía WhatsApp",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
