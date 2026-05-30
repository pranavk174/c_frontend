"use client";
import { Message } from "@/lib/dummy";

import React, { Dispatch, RefObject, SetStateAction, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface UploaderProps {
    startUpload: () => Promise<void>
    cancelUpload: () => Promise<"success" | undefined>
    uploadChunks: (id: string) => Promise<void>
    setMessages: Dispatch<SetStateAction<Message[]>>, messages: Message[]
    pausedRef: RefObject<boolean>
    setFile: Dispatch<SetStateAction<File | null>>
    progress: number
    uploadId: string
}

const Uploader = ({ startUpload, cancelUpload, setMessages, uploadChunks, pausedRef, setFile, progress, uploadId }: UploaderProps) => {
    // const [file, setFile] = useState<File | null>(null);

    // const startUpload = async () => {
    //     if (!file || currentChunk > 0) return;




    //     setMessages(prev => [
    //         ...prev,
    //         {
    //             id: (prev[prev.length - 1]?.id || 0) + 1,
    //             sender_id: user_id ?? 2,
    //             created_at: new Date().toISOString(),
    //             seen_at: null,
    //             story_id: null,
    //             content: "meida_upload",
    //             reply_to_message: null,
    //             is_forwarded: false,
    //             is_edited: false,
    //             is_deleted: false,
    //             reactions: [],
    //             isLocal: true
    //         }
    //     ])

    //     controllerRef.current = new AbortController();
    //     const upload = await fetch(`${process.env.NEXT_PUBLIC_DOMAIN}/api/upload/start`, {
    //         method: "POST",
    //         headers: {
    //             "Content-type": "application/json",
    //         }
    //     });

    //     const data = await upload.json();
    //     console.log(data, "data....");
    //     const id = data.uploadId;
    //     setUploadId(id);

    //     uploadChunks(id);
    // };

    // const uploadChunks = async (id: string) => {
    //     try {
    //         if (!file) return;
    //         const totalChunk = Math.ceil(file.size / CHUNK_SIZE);

    //         for (let i = currentChunk; i < totalChunk; i++) {
    //             if (pausedRef.current === true) {
    //                 return;
    //             }

    //             const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    //             //  console.log();
    //             const form = new FormData();
    //             form.append("uploadId", id);
    //             form.append("chunk", chunk);
    //             form.append("index", i.toString());

    //             await fetch(`${process.env.NEXT_PUBLIC_DOMAIN}/api/upload/upload`, {
    //                 method: "POST",
    //                 body: form,
    //                 signal: controllerRef.current?.signal,
    //             });
    //             setCurrentChunk(i + 1);
    //             setProgress(Math.round(((i + 1) / totalChunk) * 100));
    //         }

    //         const done = await fetch(`${process.env.NEXT_PUBLIC_DOMAIN}/api/upload/finish`, {
    //             method: "POST",
    //             headers: { "Content-type": "application/json" },
    //             body: JSON.stringify({
    //                 uploadId: id,
    //                 extension: file.name.split(".").pop(),
    //             }),
    //         });

    //         if (done.ok) {
    //             //  console.log(done);
    //             alert("upload completed");
    //         } else {
    //             alert("error in uploading");
    //         }
    //     } catch (error) {
    //         alert("error in uploading");
    //     }
    // };

    // const cancelUpload = async () => {
    //     controllerRef.current?.abort();

    //     try {
    //         const res = await fetch(`${process.env.NEXT_PUBLIC_DOMAIN}/api/product/cancel`, {
    //             method: "POST",
    //             headers: {
    //                 "Content-type": "application/json",
    //             },
    //             body: JSON.stringify({

    //                 uploadId: uploadId,
    //             }),
    //         });

    //         setProgress(0);
    //         setCurrentChunk(0);
    //         setUploadId("");
    //         if (res.ok) {
    //             return "success";
    //         }
    //     } catch (error) {
    //         //  console.log(error, "errorrrrr");
    //     }
    // };

    //   //  console.log(paused, "paused...");


    return (
        <div className=" bg-gray-100 h-screen  items-center justify-center p-6">
            <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-semibold mb-6 text-center">File Upload</h2>

                <div>
                    <div className="flex justify-between mb-2 text-sm font-medium text-gray-700">
                        <span>Upload Progress</span>
                        <span>{progress}%</span>
                    </div>

                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* File Input */}
                <label className="block mb-4">
                    <span className="block text-sm font-medium text-gray-700 mb-2">
                        Select File
                    </span>
                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
                    />
                </label>

                {/* Buttons */}
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={startUpload}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Start
                    </button>

                    <button
                        onClick={() => (pausedRef.current = true)}
                        className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition"
                    >
                        Pause
                    </button>

                    <button
                        onClick={() => {
                            pausedRef.current = false;
                            uploadChunks(uploadId);
                        }}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                    >
                        Resume
                    </button>

                    {progress > 0 && progress < 100 && (
                        <button
                            onClick={cancelUpload}
                            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
                        >
                            Cancel
                        </button>
                    )}
                </div>

                {/* Progress */}

            </div>
        </div>
    );
};

export default Uploader;