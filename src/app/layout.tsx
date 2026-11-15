import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SI-GEOMEDIK | Sistem Informasi Geomedik Kemhan RI",
  description:
    "Sistem Informasi Geospasial Fasilitas Kesehatan, SDM, Alat Kesehatan, dan Material Kesehatan Pertahanan",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full bg-slate-50 antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
