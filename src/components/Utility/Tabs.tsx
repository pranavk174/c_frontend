"use client";

import { useState } from "react";

type Tab = {
  id: string | number;
  label: string;
  disabled?: boolean;
};

type TabsProps = {
  tabs: Tab[];
  defaultTab?: string | number;
  onChange?: (tabId: string | number) => void;
};

const Tabs = ({ tabs, defaultTab, onChange }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id);

  const handleTabChange = (tab: Tab) => {
    if (tab.disabled) return;

    setActiveTab(tab.id);
    onChange?.(tab.id);
  };

  return (
    <ul className="flex flex-wrap text-sm font-medium text-center text-body">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <li key={tab.id} className="me-2">
            <button
              type="button"
              disabled={tab.disabled}
              onClick={() => handleTabChange(tab)}
              className={`
                inline-block px-4 py-2.5 rounded-lg transition-colors

                ${
                  isActive
                    ? "text-white bg-wa-primary"
                    : "text-gray-400 hover:text-white hover:bg-[#202c33]"
                }

                ${
                  tab.disabled
                    ? "text-gray-600 cursor-not-allowed hover:bg-transparent"
                    : "cursor-pointer"
                }
              `}
            >
              {tab.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default Tabs;
