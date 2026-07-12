import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { CartProvider } from "@/contexts/CartContext";
import { PaymentProvider } from "@/contexts/PaymentContext";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { cn } from "@/lib/utils";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart Restaurant Ecosystem",
  description: "Minimal, structured, high-end restaurant experience.",
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", outfit.variable, plusJakartaSans.variable)}>
      <body
        className="font-sans antialiased bg-gray-50"
        suppressHydrationWarning
      >
        <QueryProvider>
          <AuthProvider>
            <SessionProvider>
              <CartProvider>
                <PaymentProvider>
                  {children}
                </PaymentProvider>
              </CartProvider>
            </SessionProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
