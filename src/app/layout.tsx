import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { DisplayModeProvider } from "@/contexts/DisplayModeContext";
import { SWRProvider } from "@/components/providers/SWRProvider";

export const metadata: Metadata = {
  title: "ToughFlow",
  description: "戸塚重量 業務効率化システム（モバイル）",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ToughFlow",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0071e3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <SWRProvider>
          <DisplayModeProvider>
            <AuthProvider>{children}</AuthProvider>
          </DisplayModeProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
