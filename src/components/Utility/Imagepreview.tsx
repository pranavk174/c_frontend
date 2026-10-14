"use client"
import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const Imagepreview = ({ image }: { image?: string }) => {
    const router = useRouter()
    return (
        <div className="w-full min-h-screen bg-black flex items-center justify-center p-5">
            <button className='bg-red-400' onClick={() => router.back()}>
                Back
            </button>
            {image ? (
                <div className="relative w-full max-w-5xl h-[90vh]">
                    <Image priority
                        src={image}
                        alt="preview"
                        fill

                        unoptimized
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-contain rounded-2xl"
                    />
                </div>
            ) : (
                <p className="text-white text-lg">
                    No image found
                </p>
            )}
        </div>
    )
}

export default Imagepreview