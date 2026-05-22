import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Wrapper from "@/redux/Wrapper";
import { ToastProvider } from "@/components/Utility/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WhatsApp Web Clone",
  description: "A clone of WhatsApp Web built with Next.js and Tailwind CSS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#e0e0e0] text-[#111b21] dark:bg-[#111b21] dark:text-[#e9edef] overflow-hidden">
        <Wrapper>

          <ToastProvider>



            {children}
          </ToastProvider>

        </Wrapper>
      </body>
    </html>
  );
}
