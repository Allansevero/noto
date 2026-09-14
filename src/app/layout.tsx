import type { Metadata } from "next";
import { Inter, Manrope, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NotoMed - Plataforma Fiscal para Médicos",
  description: "Configuração fiscal automatizada, emissão de NFS-e e integração com prefeituras via Focus NFe.",
  icons: {
    icon: "/logo-notomed.svg",
    shortcut: "/logo-notomed.svg",
    apple: "/logo-notomed.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={cn(inter.variable, manrope.variable, "font-sans", geist.variable)}>
      <body suppressHydrationWarning className="font-sans antialiased bg-white text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
