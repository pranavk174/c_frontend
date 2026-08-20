"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGetUserQuery } from "@/redux/Apis/Users";
import ProfileSection from "./ProfileSection";
import PrivacySection from "./PrivacySection";
import NotificationsSection from "./NotificationsSection";
import AppearanceSection from "./AppearanceSection";
import AccountSection from "./AccountSection";

const SettingsPage = () => {
    const router = useRouter();
    const { data, isLoading } = useGetUserQuery(null);
    const user = data?.data?.getUser?.data;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wa-primary dark:border-wa-primary-dark"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-wa-bg dark:bg-wa-bg-dark overflow-hidden">
            {/* Header */}
            <header className="shrink-0 flex items-center gap-4 px-5 py-4 bg-wa-panel dark:bg-wa-panel-dark border-b border-wa-divider dark:border-wa-divider-dark">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition"
                >
                    <ArrowLeft className="w-5 h-5 text-wa-icon dark:text-wa-icon-dark" />
                </button>
                <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Settings</h1>
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto py-4">
                    {user && <ProfileSection user={user} />}
                    <PrivacySection />
                    <NotificationsSection user={user} />
                    <AppearanceSection />
                    <AccountSection />
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
