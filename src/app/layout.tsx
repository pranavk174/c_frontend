import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Wrapper from "@/redux/Wrapper";
import { ToastProvider } from "@/components/Utility/Toast";
import { cookies } from "next/headers";
import { logger } from "@/lib/utils";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WhatsApp Web Clone",
  description: "A clone of WhatsApp Web built with Next.js and Tailwind CSS",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = (await cookies()).get("theme")?.value;
  const isDark = theme === "dark";

  // logger.log(document.cookie, "cookie dataaaa");

  return (
    <html lang="en" className={`${inter.className} h-full antialiased ${isDark ? "dark" : ""}`}>
      <body className="min-h-full flex flex-col bg-wa-bg text-wa-bg-dark dark:bg-wa-bg-dark dark:text-wa-divider overflow-hidden">
        <Wrapper>
          <ToastProvider>{children}</ToastProvider>
        </Wrapper>
      </body>
    </html>
  );
}
