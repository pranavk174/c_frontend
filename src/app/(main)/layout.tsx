import Sidebar from "@/components/Sidebar";
// import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Authlayout from "@/layouts/Authlayout";
import { SocketProvider } from "@/layouts/SocketWrapper";
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const pathname = usePathname();
  // const isChatOpen = pathname.startsWith("/chat/");

  return (
    <Authlayout>
      <SocketProvider>
        <div className="flex h-screen w-full bg-wa-bg dark:bg-wa-bg-dark overflow-hidden relative">
          {/* WhatsApp Green Top Bar Background (Visible only on large screens) */}
          <div className="absolute top-0 left-0 w-full h-31.75 bg-wa-primary dark:bg-wa-primary-dark hidden md:block z-0"></div>

          {/* Main Container Wrapper */}
          <div className="relative z-10 flex w-full h-full md:p-4.75 max-w-400 md:mx-auto">
            <div className="flex w-full h-full bg-wa-panel dark:bg-wa-panel-dark md:shadow-lg md:rounded-sm overflow-hidden">
              {/* <div
                className={cn()
                // "w-full md:w-[30%] md:max-w-75 lg:max-w-100 h-full ",
                // isChatOpen ? "hidden md:block" : "block",
                }
              > */}
              <Sidebar />
              {/* </div> */}
              <div
                className={cn(
                  "flex w-full p-1 relative bg-wa-bg dark:bg-[#222e35]",
                  // isChatOpen ? "flex" : "hidden md:flex",
                )}
              >
                {children}
              </div>
            </div>
          </div>
        </div>
      </SocketProvider>
    </Authlayout>
  );
}
