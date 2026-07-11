import { Lock } from "lucide-react";
import Image from "next/image";

export default function EmptyStatePage() {
  return (
    <div className="flex flex-col w-full items-center justify-center h-full text-center px-4">
      {/* Empty State Graphic */}
      {/* <Image  priority
        height={200}
        width={200}
        src="https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669aeJeom.png"
        alt="WhatsApp Web"
        className="w-80 h-auto mb-8 opacity-80"
      /> */}
      <h1 className="text-3xl font-light text-gray-800 dark:text-gray-200 mb-4">
        WhatsApp for Windows
      </h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-md text-sm mb-8 leading-relaxed">
        Send and receive messages without keeping your phone online.
        <br />
        Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
      </p>

      <div className="absolute bottom-10 flex items-center text-xs text-gray-400 dark:text-gray-500">
        <Lock className="w-3 h-3 mr-1" />
        End-to-end encrypted
      </div>
    </div>
  );
}
