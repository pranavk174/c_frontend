"use client";

import React, { useState } from "react";
import { Volume2 } from "lucide-react";
import SettingsRow from "./SettingsRow";
import SoundToggle from "@/components/Utility/Togglebuton";
import { useUpdatePreferenceMutation } from "@/redux/Apis/Users";
import { profileProps } from "@/lib/dummy";

interface NotificationsSectionProps {
    user?: profileProps;
}

const NotificationsSection = ({ user }: NotificationsSectionProps) => {
    const [soundEnabled, setSoundEnabled] = useState(true); // Default to true since we don't have this in user data yet
    const [updatePreference] = useUpdatePreferenceMutation();

    const handleToggle = async () => {
        const newValue = !soundEnabled;
        setSoundEnabled(newValue);
        // TODO: Wire to backend when notification preference field is added
        // await updatePreference({ notificationSound: newValue }).unwrap();
    };

    return (
        <section className="mb-2">
            <div className="px-5 pt-5 pb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-wa-primary dark:text-wa-primary-dark">
                    Notifications
                </h2>
            </div>

            <div className="bg-wa-panel dark:bg-wa-panel-dark rounded-xl mx-4 overflow-hidden border border-wa-divider dark:border-wa-divider-dark">
                <SettingsRow
                    icon={<Volume2 className="w-5 h-5" />}
                    label="Message Sounds"
                    description="Play sound for new messages"
                    action={
                        <SoundToggle
                            left=""
                            right=""
                            name="sound"
                            value={soundEnabled}
                            handleToggle={handleToggle}
                        />
                    }
                />
            </div>
        </section>
    );
};

export default NotificationsSection;
