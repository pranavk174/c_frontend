

"use client";

import React, { Dispatch, SetStateAction, useRef, useState } from "react";
import {
    Paperclip,
    Image,
    FileText,
    Camera,
    Music,
    MapPin,
    User,
} from "lucide-react";
import Uploader from "../Uploader/Uploader";
import { Message } from "@/lib/dummy";
import Modal from "../HOComponents/Modal";
import MediaPreviewContent from "../ModalChilds/MediaPreviewContent";


interface mediaOptionsProps {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>
    setMessages: Dispatch<SetStateAction<Message[]>>
    startUpload: () => Promise<void>
    cancelUpload: () => Promise<"success" | undefined>
    uploadChunks: (id: string) => Promise<void>
    pausedRef: React.RefObject<boolean>
    setFile: React.Dispatch<React.SetStateAction<File | null>>
    progress: number
    file: File | null
    uploadId: string
    messages: Message[]
    inputText: string
    setInputText: Dispatch<SetStateAction<string>>

}
import { useToast } from "../Utility/Toast";
const MediaOptions = ({ messages, setInputText, inputText, file, open, pausedRef, progress, uploadId, setFile, startUpload, setOpen, cancelUpload, setMessages, uploadChunks }: mediaOptionsProps) => {

    const [show, setShow] = useState(false)
    const imageRef = useRef<HTMLInputElement>(null);
    const documentRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLInputElement>(null);


    const { showToast } = useToast()



    return (
        <div className="relative">
            {/* Hidden Inputs */}
            <input
                ref={imageRef}
                type="file"
                onChange={(e) => {
                    console.log(e.target.files?.[0], "file detailll....")
                    if (e.target.files?.[0] && e.target.files?.[0].size > 10485760) {
                        showToast("File Size Cant be Greater then 10MB", "error")

                        return

                    }
                    setFile(e.target.files?.[0] || null)

                    if (e.target.files?.[0]) {
                        setShow(p => !p)
                    }



                }}
                accept="image/*"
                hidden

            />

            <input
                ref={documentRef}
                type="file"
                hidden
                onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <input
                ref={audioRef}
                type="file"
                accept="audio/*"
                hidden
                onChange={(e) => setFile(e.target.files?.[0] || null)}
            />


            {/* <Uploader pausedRef={pausedRef} setFile={setFile} progress={progress} uploadId={uploadId} messages={messages} uploadChunks={uploadChunks} cancelUpload={cancelUpload} startUpload={startUpload} setMessages={setMessages} /> */}

            {/* Options UI */}
            {open && (
                <div className="absolute bottom-10 left-0 bg-white dark:bg-neutral-900 shadow-2xl rounded-3xl p-4 w-[280px] border border-black/10 dark:border-white/10">
                    <div className="grid grid-cols-3 gap-4">
                        {/* Photos */}
                        <button
                            onClick={() => {
                                imageRef.current?.click();
                                setOpen(false);
                            }}
                            className="flex flex-col items-center gap-2"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center">
                                <Image className="size-6" />
                            </div>

                            <span className="text-xs">Photos</span>
                        </button>

                        {/* Documents */}
                        <button
                            onClick={() => {
                                documentRef.current?.click();
                                setOpen(false);
                            }}
                            className="flex flex-col items-center gap-2"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center">
                                <FileText className="w-6 h-6" />
                            </div>

                            <span className="text-xs">Document</span>
                        </button>

                        {/* Camera */}
                        <button
                            className="flex flex-col items-center gap-2"
                            onClick={() => {
                                console.log("Open Camera");
                                setOpen(false);
                            }}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-pink-500 text-white flex items-center justify-center">
                                <Camera className="w-6 h-6" />
                            </div>

                            <span className="text-xs">Camera</span>
                        </button>

                        {/* Audio */}
                        <button
                            onClick={() => {
                                audioRef.current?.click();
                                setOpen(false);
                            }}
                            className="flex flex-col items-center gap-2"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-green-500 text-white flex items-center justify-center">
                                <Music className="w-6 h-6" />
                            </div>

                            <span className="text-xs">Audio</span>
                        </button>

                        {/* Location */}
                        <button
                            className="flex flex-col items-center gap-2"
                            onClick={() => {
                                console.log("Share Location");
                                setOpen(false);
                            }}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-red-500 text-white flex items-center justify-center">
                                <MapPin className="w-6 h-6" />
                            </div>

                            <span className="text-xs">Location</span>
                        </button>

                        {/* Contact */}
                        <button
                            className="flex flex-col items-center gap-2"
                            onClick={() => {
                                console.log("Share Contact");
                                setOpen(false);
                            }}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-purple-500 text-white flex items-center justify-center">
                                <User className="w-6 h-6" />
                            </div>

                            <span className="text-xs">Contact</span>
                        </button>
                    </div>
                </div>
            )}
            <Modal open={show} setOpen={setShow}>
                {file && <MediaPreviewContent
                    file={file}
                    inputText={inputText}
                    setInputText={setInputText}
                    onSend={(data) => {
                        startUpload()
                        setInputText(data.caption)
                        console.log(data, "dataaa detailllllllll")
                        setShow(false)
                    }}
                />}
            </Modal>

            {/* Attachment Button */}

        </div>
    );
};

export default MediaOptions;