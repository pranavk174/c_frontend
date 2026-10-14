"use client";


interface SpinnerProps {
    height: string,
    width: string
}

export default function SpinLoader({ height = "60px", width = "60px" }: SpinnerProps) {
    return (
        <div className="relative "

            style={{
                height: height,
                width: width
            }}
        >
            <div className="absolute inset-0 rounded-full border-4 border-[#1f2c34]" />

            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#25d366] animate-spin" />
        </div>
    );
}