"use client"
import React, { useRef, useState } from 'react'
import SoundToggle from './Togglebuton';
import { useUpdatePreferenceMutation } from '@/redux/Apis/Users';
import { logger } from "@/lib/utils";


const DarkthemeToggle = () => {
    const [isDark, setIsDark] = useState<boolean>(() => {
        if (typeof document === "undefined") return false;
        return document.documentElement.classList.contains("dark");
    });
    const [updatePreference] = useUpdatePreferenceMutation();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleUpdate = async (theme: "dark" | "light") => {
        try {
            await updatePreference({ theme }).unwrap();
        } catch (error) {
            logger.log(error);
        }
    };
    const debouncedUpdateTheme = (theme: "dark" | "light") => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            handleUpdate(theme);
        }, 500);
    };
    return (
        <div className={` mt-4 rotate-90 text-[clamp(16px,4vw,16px)]`}>
            <SoundToggle
                left={""}
                name={"theme"}
                value={isDark}

                right={""}
                handleToggle={() => {
                    const value = isDark ? "light" : "dark"
                    document.cookie = `theme=${value}; path=/;`;
                    document.documentElement.classList.remove("dark", "light");
                    document.documentElement.classList.add(value);
                    setIsDark(value === "dark");
                    debouncedUpdateTheme(value);
                }}
            />
        </div>
    )
}

export default DarkthemeToggle