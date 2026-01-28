import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CakapNBayar - Voice-Powered POS System",
  description: "Sistem POS berkuasa suara untuk perniagaan Malaysia",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CakapNBayar",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms">
      <body className={inter.className}>
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
