import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tráelo Ya | Compras en Estados Unidos, entregas en Bolivia",
  description:
    "Compra en tiendas de Estados Unidos y recibe tu pedido en Bolivia en 7 a 10 días hábiles. Cotiza por producto o por peso, con atención personalizada.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white font-sans text-navy-900">
        {children}
      </body>
    </html>
  );
}
