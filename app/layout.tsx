import type { Metadata } from "next";
import "./globals.css";
import "./redesign.css";

export const metadata: Metadata = {
  title: "Café da Serra | Portal da Serra",
  description:
    "Uma experiência digital para o Café da Serra, no Portal da Serra, entre Dois Irmãos e Ivoti.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
