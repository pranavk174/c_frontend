"use client";

import { selectedProp } from "@/lib/dummy";
import { useEditMessageMutation } from "@/redux/Apis/Chat";
import { useState } from "react";

interface EditMessageProps {
  initialMessage: selectedProp;
  onSave: (message: string) => void;
  onCancel: () => void;
  chatId: number;
}

export default function EditMessage({
  chatId,
  initialMessage,
  onSave,
  onCancel,
}: EditMessageProps) {
  const [message, setMessage] = useState(initialMessage.message);
  const [editMessage, { isLoading }] = useEditMessageMutation();

  const handleSave = async () => {
    try {
      //   await editMessage({
      //     content: message,
      //     message_id: initialMessage.id,
      //     chat_id: chatId,
      //   }).unwrap();
      onSave(message);
    } catch (error) {
      console.log(error, "errror");
    }
  };

  return (
    <div className="w-full max-w-lg bg-wa-primary-dark p-2 rounded-lg">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Edit Message</h2>
        <p className="text-sm text-gray-800">
          Update your message and save changes.
        </p>
      </div>

      {/* Original Message Preview */}
      <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3">
        <p className="text-xs font-medium text-green-700 mb-1">
          Original Message
        </p>
        <p className="text-sm text-gray-700 wrap-break-word">
          {initialMessage.message}
        </p>
      </div>

      {/* Editable Text Area */}
      <div className="mb-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          autoFocus
          className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
          placeholder="Edit your message..."
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {message.length} characters
        </span>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={!message.trim() || isLoading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
