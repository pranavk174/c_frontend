"use client";
import { registerToast } from "@/redux/toastservices";
import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useCallback,
    useEffect,
} from "react";

import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Info,
    AlertCircle,
    X,
} from "lucide-react";

// =========================
// TYPES
// =========================

type ToastType =
    | "success"
    | "error"
    | "warning"
    | "missing"
    | "failed";

interface ToastState {
    open: boolean;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (
        message: string,
        type?: ToastType
    ) => void;
}

// =========================
// CONTEXT
// =========================

const ToastContext =
    createContext<
        ToastContextType | undefined
    >(undefined);

// =========================
// STYLES
// =========================

const toastStyles = {
    success: {
        icon: CheckCircle2,
        className:
            "bg-green-500/10 border-green-500/30 text-green-500",
    },

    error: {
        icon: XCircle,
        className:
            "bg-red-500/10 border-red-500/30 text-red-500",
    },

    failed: {
        icon: AlertCircle,
        className:
            "bg-red-500/10 border-red-500/30 text-red-500",
    },

    warning: {
        icon: AlertTriangle,
        className:
            "bg-yellow-500/10 border-yellow-500/30 text-yellow-500",
    },

    missing: {
        icon: Info,
        className:
            "bg-blue-500/10 border-blue-500/30 text-blue-500",
    },
};

// =========================
// PROVIDER
// =========================

export const ToastProvider = ({
    children,
}: {
    children: ReactNode;
}) => {
    const [toast, setToast] =
        useState<ToastState>({
            open: false,
            message: "",
            type: "success",
        });

    const showToast =
        useCallback(
            (
                message: string,
                type: ToastType =
                    "success"
            ) => {
                setToast({
                    open: true,
                    message,
                    type,
                });

                setTimeout(() => {
                    setToast(
                        (
                            prev
                        ) => ({
                            ...prev,
                            open: false,
                        })
                    );
                }, 3000);
            },
            []
        );

    const closeToast =
        () => {
            setToast(
                (
                    prev
                ) => ({
                    ...prev,
                    open: false,
                })
            );
        };

    const {
        icon: Icon,
        className,
    } =
        toastStyles[
        toast.type
        ];



    useEffect(() => {
        registerToast(showToast);
    }, [showToast]);

    return (
        <ToastContext.Provider
            value={{
                showToast,
            }}
        >
            {children}

            {toast.open && (
                <div className="fixed top-5 right-5 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300">
                    <div
                        className={`min-w-[320px] max-w-[400px] border backdrop-blur-xl shadow-2xl rounded-2xl p-4 flex items-start gap-3 ${className}`}
                    >
                        <Icon className="w-5 h-5 mt-0.5 shrink-0" />

                        <div className="flex-1">
                            <p className="text-sm font-medium">
                                {
                                    toast.message
                                }
                            </p>
                        </div>

                        <button
                            onClick={
                                closeToast
                            }
                            className="opacity-70 hover:opacity-100 transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
};

// =========================
// HOOK
// =========================

export const useToast =
    () => {
        const context =
            useContext(
                ToastContext
            );

        if (!context) {
            throw new Error(
                "useToast must be used inside ToastProvider"
            );
        }

        return context;
    };