"use client";

export default function Loader() {
    return (
        <div className="fixed inset-0 bg-[#111b21] flex items-center justify-center">
            <div className="flex flex-col items-center gap-5">
                {/* Logo Circle */}
                <div className="h-16 w-16 rounded-full bg-[#25d366] flex items-center justify-center shadow-lg">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="white"
                        viewBox="0 0 24 24"
                        className="w-8 h-8"
                    >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.768.966-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.693.626.711.227 1.358.195 1.87.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    </svg>
                </div>

                {/* Dots */}
                <div className="flex gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#25d366] animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-3 w-3 rounded-full bg-[#25d366] animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-3 w-3 rounded-full bg-[#25d366] animate-bounce" />
                </div>

                <p className="text-[#8696a0] text-sm">
                    Loading chats...
                </p>
            </div>
        </div>
    );
}