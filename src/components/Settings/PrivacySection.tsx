"use client";

import React, { useState } from "react";
import { Eye, Image, FileText, BookOpen } from "lucide-react";
import SettingsRow from "./SettingsRow";
import { useToast } from "@/components/Utility/Toast";

export type PrivacyVisibility = "Everyone" | "My Contacts" | "Nobody";

const VISIBILITY_OPTIONS: PrivacyVisibility[] = ["Everyone", "My Contacts", "Nobody"];

interface PrivacyState {
    lastSeen: PrivacyVisibility;
    profilePhoto: PrivacyVisibility;
    bio: PrivacyVisibility;
    story: PrivacyVisibility;
}

const defaultPrivacy: PrivacyState = {
    lastSeen: "Everyone",
    profilePhoto: "Everyone",
    bio: "Everyone",
    story: "Everyone",
};

interface PrivacySectionProps {
    initialPrivacy?: Partial<PrivacyState>;
}

type PrivacyField = keyof PrivacyState;

const PrivacySelect = ({
    value,
    onChange,
}: {
    value: PrivacyVisibility;
    onChange: (val: PrivacyVisibility) => void;
}) => (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value as PrivacyVisibility)}
        className="bg-transparent text-sm text-gray-700 dark:text-gray-300 border border-wa-divider dark:border-wa-divider-dark rounded-md px-2 py-1 outline-none focus:border-wa-primary dark:focus:border-wa-primary-dark cursor-pointer"
    >
        {VISIBILITY_OPTIONS.map((opt) => (
            <option key={opt} value={opt} className="bg-white dark:bg-[#233138]">
                {opt}
            </option>
        ))}
    </select>
);

const PrivacySection = ({ initialPrivacy }: PrivacySectionProps) => {
    const [privacy, setPrivacy] = useState<PrivacyState>({
        ...defaultPrivacy,
        ...initialPrivacy,
    });
    const { showToast } = useToast();

    const handleChange = async (field: PrivacyField, value: PrivacyVisibility) => {
        // Optimistic update not applied — only update on success
        try {
            // TODO: wire to updatePrivacySettings API when available
            // await updatePrivacy({ privacy_type: value, entity_type: field }).unwrap();
            setPrivacy((prev) => ({ ...prev, [field]: value }));
        } catch {
            showToast("Failed to update privacy setting.", "error");
            // Revert: keep previous value (state not changed on error since we didn't optimistically update)
        }
    };

    const rows: { field: PrivacyField; label: string; description: string; icon: React.ReactNode }[] = [
        {
            field: "lastSeen",
            label: "Last Seen",
            description: "Who can see when you were last online",
            icon: <Eye className="w-5 h-5" />,
        },
        {
            field: "profilePhoto",
            label: "Profile Photo",
            description: "Who can see your profile picture",
            icon: <Image className="w-5 h-5" />,
        },
        {
            field: "bio",
            label: "Bio",
            description: "Who can see your bio",
            icon: <FileText className="w-5 h-5" />,
        },
        {
            field: "story",
            label: "Story",
            description: "Who can see your stories",
            icon: <BookOpen className="w-5 h-5" />,
        },
    ];

    return (
        <section className="mb-2">
            <div className="px-5 pt-5 pb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-wa-primary dark:text-wa-primary-dark">
                    Privacy
                </h2>
            </div>

            <div className="bg-wa-panel dark:bg-wa-panel-dark rounded-xl mx-4 overflow-hidden border border-wa-divider dark:border-wa-divider-dark">
                {rows.map(({ field, label, description, icon }) => (
                    <SettingsRow
                        key={field}
                        icon={icon}
                        label={label}
                        description={description}
                        action={
                            <PrivacySelect
                                value={privacy[field]}
                                onChange={(val) => handleChange(field, val)}
                            />
                        }
                    />
                ))}
            </div>
        </section>
    );
};

export default PrivacySection;
