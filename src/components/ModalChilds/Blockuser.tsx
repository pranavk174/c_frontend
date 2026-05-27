"use client";

import React, { Dispatch, SetStateAction, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { profileProps, socketResponse } from "@/lib/dummy";
import { useBlockUserMutation } from "@/redux/Apis/User";
import { useSocket } from "@/layouts/SocketWrapper";
import { CHAT_LEAVED } from "@/lib/events";
type BlockUserProps = {
  userId?: number | string;

  name?: string;
  setOpen: Dispatch<SetStateAction<boolean>>;
  open: boolean;
  chatId?: number;
};

const reasons = [
  "Spam",
  "Harassment",
  "Fake Profile",
  "Abusive Messages",
  "Inappropriate Content",
  "Other",
];

const BlockUser = ({ name, userId, setOpen, open, chatId }: BlockUserProps) => {
  const socket = useSocket();
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const [blockUser, { isLoading, isSuccess, error }] = useBlockUserMutation();
  const handleSubmit = async () => {
    const finalReason =
      selectedReason === "Other" ? customReason : selectedReason;

    if (!finalReason.trim()) {
      alert("Please select a reason");
      return;
    }

    try {
      await blockUser({ user_id: userId, reason: finalReason }).unwrap();
      socket.emit(
        CHAT_LEAVED,
        { chat_id: chatId, user_id: userId },
        (response: socketResponse) => {
          console.log("user left ", response);
        },
      );
      setOpen(false);
    } catch (error) {
      console.log(error, "error in bloackkk.....");
    }

    // onSubmit?.({
    //   userId,
    //   reason: finalReason,
    // });
  };

  return (
    <div className="w-full max-w-md overflow-hidden rounded-3xl bg-[#111B21] text-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#202C33] bg-[#202C33] px-5 py-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366]/20">
          <ShieldAlert size={22} className="text-[#25D366]" />
        </div>

        <div>
          <h2 className="text-lg font-semibold">Block {name}</h2>

          <p className="text-xs text-gray-400">User ID: {userId}</p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 p-5">
        <p className="text-sm text-gray-400">
          Select a reason for blocking this user.
        </p>

        {reasons.map((reason) => (
          <label
            key={reason}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${
              selectedReason === reason
                ? "border-[#25D366] bg-[#25D366]/10"
                : "border-[#2A3942] bg-[#1F2C34]"
            }`}
          >
            <input
              type="radio"
              name="reason"
              value={reason}
              checked={selectedReason === reason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="accent-[#25D366]"
            />

            <span className="text-sm font-medium">{reason}</span>
          </label>
        ))}

        {selectedReason === "Other" && (
          <textarea
            placeholder="Write reason..."
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className="min-h-[100px] w-full rounded-2xl border border-[#2A3942] bg-[#1F2C34] p-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#25D366]"
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-[#202C33] bg-[#202C33] px-5 py-4">
        <button
          onClick={() => setOpen(false)}
          className="rounded-full px-5 py-2 text-sm font-medium text-gray-300 transition hover:bg-[#1F2C34]"
        >
          Cancel
        </button>

        <button
          disabled={isLoading}
          onClick={handleSubmit}
          className="rounded-full bg-[#25D366] px-5 py-2 text-sm font-semibold text-[#111B21] transition hover:bg-[#20bd5a] disabled:opacity-50"
        >
          {isLoading ? "Blocking..." : "Block User"}
        </button>
      </div>
    </div>
  );
};

export default BlockUser;
