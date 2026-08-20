"use client";

import React, { useState } from "react";
import { Shield, Trash2, LogOut, ChevronRight } from "lucide-react";
import SettingsRow from "./SettingsRow";
import { useLogoutMutation } from "@/redux/Apis/Users";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Utility/Toast";

const AccountSection = () => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [logout] = useLogoutMutation();
    const router = useRouter();
    const { showToast } = useToast();

    const handleLogout = async () => {
        try {
            await logout(null).unwrap();
            document.documentElement.classList.remove("dark", "light");
            router.replace("/login");
        } catch {
            showToast("Failed to logout. Please try again.", "error");
        }
    };

    const handleDeleteAccount = () => {
        // TODO: Wire to delete account API when ready
        showToast("Delete account functionality coming soon", "warning");
        setShowDeleteConfirm(false);
    };

    return (
        <>
            <section className="mb-2">
                <div className="px-5 pt-5 pb-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-wa-primary dark:text-wa-primary-dark">
                        Account
                    </h2>
                </div>

                <div className="bg-wa-panel dark:bg-wa-panel-dark rounded-xl mx-4 overflow-hidden border border-wa-divider dark:border-wa-divider-dark">
                    <SettingsRow
                        icon={<Shield className="w-5 h-5" />}
                        label="Blocked Users"
                        description="Manage blocked contacts"
                        action={
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">0</span>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                        }
                    />

                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full flex items-center justify-between px-5 py-4 border-b border-wa-divider dark:border-wa-divider-dark last:border-b-0 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <Trash2 className="w-5 h-5 text-red-500 shrink-0" />
                            <div className="min-w-0 text-left">
                                <p className="text-sm font-medium text-red-500">Delete Account</p>
                                <p className="text-xs text-red-400 mt-0.5">Permanently delete your account</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <LogOut className="w-5 h-5 text-wa-icon dark:text-wa-icon-dark shrink-0" />
                            <div className="min-w-0 text-left">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Log Out</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sign out of your account</p>
                            </div>
                        </div>
                    </button>
                </div>
            </section>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#233138] rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                            Delete Account?
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            This action cannot be undone. All your data will be permanently deleted.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 rounded-lg border border-wa-divider dark:border-wa-divider-dark text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AccountSection;
