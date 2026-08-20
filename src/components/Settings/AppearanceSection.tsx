"use client";

import React from "react";
import { Palette } from "lucide-react";
import SettingsRow from "./SettingsRow";
import DarkthemeToggle from "@/components/Utility/DarkthemeToggle";

const AppearanceSection = () => {
    return (
        <section className="mb-2">
            <div className="px-5 pt-5 pb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-wa-primary dark:text-wa-primary-dark">
                    Appearance
                </h2>
            </div>

            <div className="bg-wa-panel dark:bg-wa-panel-dark rounded-xl mx-4 overflow-hidden border border-wa-divider dark:border-wa-divider-dark">
                <SettingsRow
                    icon={<Palette className="w-5 h-5" />}
                    label="Theme"
                    description="Switch between light and dark mode"
                    action={<DarkthemeToggle />}
                />
            </div>
        </section>
    );
};

export default AppearanceSection;
