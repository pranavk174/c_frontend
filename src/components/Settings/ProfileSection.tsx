"use client";

import React, { useState } from "react";
import { Check, X, Pencil, User, Mail, Phone, FileText } from "lucide-react";
import { profileProps } from "@/lib/dummy";
import { useUpdateUserMutation } from "@/redux/Apis/Users";
import { useToast } from "@/components/Utility/Toast";
import Uploader from "@/components/Utility/Uploader";

interface ProfileSectionProps {
    user: profileProps;
}

const ProfileSection = ({ user }: ProfileSectionProps) => {
    const [formData, setFormData] = useState<profileProps>(user);
    const [editField, setEditField] = useState<"name" | "bio" | "profile_pic" | "cover_pic" | null>(null);
    const [updateUser, { isLoading }] = useUpdateUserMutation();
    const { showToast } = useToast();

    const handleSave = async () => {
        try {
            await updateUser(formData).unwrap();
            setEditField(null);
            showToast("Profile updated successfully", "success");
        } catch {
            showToast("Failed to update profile. Please try again.", "error");
        }
    };

    const handleCancel = () => {
        setFormData(user);
        setEditField(null);
    };

    return (
        <section className="mb-2">
            {/* Section Header */}
            <div className="px-5 pt-5 pb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-wa-primary dark:text-wa-primary-dark">
                    Profile
                </h2>
            </div>

            {/* Avatar + cover upload */}
            <div className="relative h-52 mx-5 rounded-xl overflow-hidden mb-16">
                <Uploader
                    isUser={true}
                    cover_pic={formData.cover_pic}
                    profile_pic={formData.profile_pic}
                    editField={editField}
                    setEditField={setEditField}
                    formData={formData}
                    setFormData={setFormData}
                />
            </div>

            {/* Fields */}
            <div className="bg-wa-panel dark:bg-wa-panel-dark rounded-xl mx-4 overflow-hidden border border-wa-divider dark:border-wa-divider-dark">
                {/* Name */}
                <div className="flex items-center gap-4 px-5 py-4 border-b border-wa-divider dark:border-wa-divider-dark">
                    <User className="w-5 h-5 text-wa-icon dark:text-wa-icon-dark shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-wa-primary dark:text-wa-primary-dark mb-1">Name</p>
                        <input
                            type="text"
                            name="name"
                            value={formData.name ?? ""}
                            disabled={editField !== "name"}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={`w-full bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100 ${editField === "name" ? "border-b border-wa-primary pb-0.5" : ""
                                }`}
                        />
                    </div>
                    {editField === "name" ? (
                        <div className="flex gap-2">
                            <button onClick={handleSave} disabled={isLoading}>
                                <Check className="w-5 h-5 text-wa-primary" />
                            </button>
                            <button onClick={handleCancel}>
                                <X className="w-5 h-5 text-red-500" />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setEditField("name")}>
                            <Pencil className="w-4 h-4 text-gray-400" />
                        </button>
                    )}
                </div>

                {/* Bio */}
                <div className="flex items-center gap-4 px-5 py-4 border-b border-wa-divider dark:border-wa-divider-dark">
                    <FileText className="w-5 h-5 text-wa-icon dark:text-wa-icon-dark shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-wa-primary dark:text-wa-primary-dark mb-1">Bio</p>
                        <input
                            type="text"
                            name="bio"
                            value={formData.bio ?? ""}
                            disabled={editField !== "bio"}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            className={`w-full bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100 ${editField === "bio" ? "border-b border-wa-primary pb-0.5" : ""
                                }`}
                        />
                    </div>
                    {editField === "bio" ? (
                        <div className="flex gap-2">
                            <button onClick={handleSave} disabled={isLoading}>
                                <Check className="w-5 h-5 text-wa-primary" />
                            </button>
                            <button onClick={handleCancel}>
                                <X className="w-5 h-5 text-red-500" />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setEditField("bio")}>
                            <Pencil className="w-4 h-4 text-gray-400" />
                        </button>
                    )}
                </div>

                {/* Email (read-only) */}
                <div className="flex items-center gap-4 px-5 py-4 border-b border-wa-divider dark:border-wa-divider-dark">
                    <Mail className="w-5 h-5 text-wa-icon dark:text-wa-icon-dark shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-wa-primary dark:text-wa-primary-dark mb-1">Email</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formData.email ?? "—"}</p>
                    </div>
                </div>

                {/* Phone (read-only) */}
                <div className="flex items-center gap-4 px-5 py-4">
                    <Phone className="w-5 h-5 text-wa-icon dark:text-wa-icon-dark shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-wa-primary dark:text-wa-primary-dark mb-1">Phone</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formData.mobile ?? "—"}</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProfileSection;
