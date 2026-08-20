"use client"
import React, { ReactNode } from "react";
import Link from "next/link";
import { logger } from "@/lib/utils";
interface SettingsRowProps {
    icon: ReactNode;
    label: string;
    description?: string;
    action: ReactNode;
}

const SettingsRow = ({ icon, label, description, action }: SettingsRowProps) => {


    logger.debug("labnekkkk", label)
    if (label === 'Story') {
        return (
            <Link href="/settings/story-privacy" className="flex items-center justify-between px-5 py-4 border-b border-wa-divider dark:border-wa-divider-dark last:border-b-0">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-wa-icon dark:text-wa-icon-dark shrink-0">{icon}</span>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</p>
                        {description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
                        )}
                    </div>
                </div>
                <div className="ml-4 shrink-0">  {">"} </div>
            </Link>
        )
    }

    return (
        <div className="flex items-center justify-between px-5 py-4 border-b border-wa-divider dark:border-wa-divider-dark last:border-b-0">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <span className="text-wa-icon dark:text-wa-icon-dark shrink-0">{icon}</span>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</p>
                    {description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
                    )}
                </div>
            </div>
            <div className="ml-4 shrink-0">{action}</div>
        </div>
    );
};

export default SettingsRow;
