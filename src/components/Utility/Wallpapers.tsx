"use client";

import { Dispatch, SetStateAction, useRef, useState } from "react";

import { Upload, Check, X } from "lucide-react";
import { valueProps } from "@/lib/dummy";

const defaultWallpapers = [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200",
    "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=1200",
    "https://images.unsplash.com/photo-1511300636408-a63a89df3482?q=80&w=1200",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200",
];

export default function ChatWallpaperSelector({ modalValues, setOpen }: { modalValues: valueProps, setOpen: Dispatch<SetStateAction<valueProps>>; }) {
    const [selectedWallpaper, setSelectedWallpaper] = useState(
        defaultWallpapers[0]
    );

    const [uploadedWallpapers, setUploadedWallpapers] = useState([]);

    const fileInputRef = useRef(null);

    const handleUpload = (e) => {
        const files = Array.from(e.target.files);

        const imageUrls = files.map((file) => URL.createObjectURL(file));

        setUploadedWallpapers((prev) => [...imageUrls, ...prev]);
    };

    const wallpapers = [...uploadedWallpapers, ...defaultWallpapers];

    return (
        <div className="h-screen relative bg-[#0b141a] text-white p-4 flex flex-col justify-center items-center">
            <div className="flex absolute top-2 right-3 justify-end w-full mb-4">
                <button
                    onClick={() => setOpen({
                        type: "null", open: false
                    })}
                    className="text-gray-400 px-2 rounded-md cursor-pointer bg-gray-700"
                >
                    X
                </button>
            </div>
            <div className="w-full max-w-6xl bg-[#111b21] rounded-3xl overflow-hidden shadow-2xl border border-[#202c33]">
                <div className="grid md:grid-cols-2">
                    {/* LEFT SIDE */}
                    <div className="p-5 border-r border-[#202c33]">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-2xl font-bold">Chat Wallpaper</h2>

                            <button
                                onClick={() => fileInputRef.current.click()}
                                className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] transition px-4 py-2 rounded-xl text-black font-semibold"
                            >
                                <Upload size={18} />
                                Upload
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                hidden
                                onChange={handleUpload}
                            />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto pr-1">
                            {wallpapers.map((wallpaper, index) => (
                                <div
                                    key={index}
                                    onClick={() => setSelectedWallpaper(wallpaper)}
                                    className={`relative cursor-pointer rounded-2xl overflow-hidden border-4 transition-all duration-200 ${selectedWallpaper === wallpaper
                                        ? "border-[#25D366] scale-[0.96]"
                                        : "border-transparent hover:scale-[0.97]"
                                        }`}
                                >
                                    <img
                                        src={wallpaper}
                                        alt="wallpaper"
                                        className="h-44 w-full object-cover"
                                    />

                                    {selectedWallpaper === wallpaper && (
                                        <div className="absolute top-2 right-2 bg-[#25D366] rounded-full p-1">
                                            <Check size={16} className="text-black" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT SIDE PREVIEW */}
                    <div
                        className="relative h-[700px] bg-cover bg-center"
                        style={{
                            backgroundImage: `url(${selectedWallpaper})`,
                        }}
                    >
                        <div className="absolute inset-0 bg-black/30" />

                        {/* CHAT UI */}
                        <div className="relative z-10 flex flex-col h-full">
                            {/* HEADER */}
                            <div className="bg-[#202c33]/90 px-4 py-3 flex items-center gap-3 backdrop-blur">
                                <img
                                    src="https://i.pravatar.cc/100?img=12"
                                    className="w-10 h-10 rounded-full"
                                />

                                <div>
                                    <h3 className="font-semibold">Pranav</h3>
                                    <p className="text-sm text-gray-300">online</p>
                                </div>
                            </div>

                            {/* MESSAGES */}
                            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                                <div className="flex justify-start">
                                    <div className="bg-[#202c33] text-white px-4 py-2 rounded-2xl max-w-[70%]">
                                        Bhai wallpaper mast lag rha 🔥
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <div className="bg-[#005c4b] text-white px-4 py-2 rounded-2xl max-w-[70%]">
                                        WhatsApp jaisa UI bnaya 😎
                                    </div>
                                </div>

                                <div className="flex justify-start">
                                    <div className="bg-[#202c33] text-white px-4 py-2 rounded-2xl max-w-[70%]">
                                        Upload bhi kr skte ho ab 📸
                                    </div>
                                </div>
                            </div>

                            {/* INPUT */}
                            <div className="bg-[#202c33]/90 p-3 backdrop-blur">
                                <div className="bg-[#2a3942] rounded-full px-4 py-3 text-gray-400">
                                    Type a message
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}