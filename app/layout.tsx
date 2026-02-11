import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  title: "CakapBayar - Voice POS System",
  description: "Sistem POS berkuasa suara untuk perniagaan Malaysia",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CakapBayar",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Inject API key at runtime so production works without redeploy when env is set
  const apiKey =
    typeof process !== 'undefined'
      ? (process.env.INTERNAL_API_KEY || process.env.NEXT_PUBLIC_INTERNAL_API_KEY || '')
      : ''
  const escapedKey = apiKey.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '')
  return (
    <html lang="ms">
      <body className={inter.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__CB_API_KEY__="${escapedKey}";`,
          }}
        />
        <div className="min-h-screen bg-gray-50">
          <Sidebar />
          <div className="lg:pl-64">
            <main className="pb-20 lg:pb-8">
              {children}
            </main>
          </div>
          <MobileNav />
        </div>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
