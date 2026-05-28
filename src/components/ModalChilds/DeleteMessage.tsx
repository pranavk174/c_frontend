import { Message } from "@/lib/dummy";
import { useAppDispatch } from "@/lib/hooks";
import { useDeleteMessagesMutation, chatApi } from "@/redux/Apis/Chat";
import React, { Dispatch, SetStateAction } from "react";

interface deleteMessageProps {
  setShowModal: Dispatch<SetStateAction<boolean>>;
  setSelected: Dispatch<SetStateAction<number[]>>;
  selectedMessages: number[];
  chat_id: number;
  setSelectedMessages: Dispatch<SetStateAction<number[]>>;
}

const DeleteMessage = ({
  setShowModal,
  setSelected,
  setSelectedMessages,
  selectedMessages,
  chat_id,
}: deleteMessageProps) => {
  const dispatch = useAppDispatch();
  const [deleteMessages] = useDeleteMessagesMutation();

  const deleteMessage = async (delete_type: string) => {
    const pathResult = dispatch(
      chatApi.util.updateQueryData(
        "getSingleChat",
        { chat_ids: [chat_id], limit: 20, cursor: null },
        (draft) => {
          draft.data.getChatById.data.items =
            draft.data.getChatById.data.items.filter(
              (message: Message) => !selectedMessages.includes(message.id),
            );
        },
      ),
    );

    try {
      await deleteMessages({
        chat_ids: [Number(chat_id)],
        message_ids: selectedMessages,
        delete_type,
      }).unwrap();

      setShowModal(false);
      setSelected([]);
      setSelectedMessages([]);
    } catch (error) {
      pathResult.undo();
      console.log(error, "error in deeltion.");
    }
  };

  return (
    <div className="w-[320px] rounded-2xl bg-white dark:bg-[#202c33] shadow-2xl overflow-hidden border border-gray-200 dark:border-[#2f3b43]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-[#2f3b43]">
        <h2 className="text-lg font-semibold text-[#111b21] dark:text-white">
          Delete Message
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Choose how you want to delete this message.
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col p-2">
        {/* Delete for me */}
        <button
          onClick={() => deleteMessage("onlyme")}
          className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-[#2a3942] transition-all"
        >
          <p className="text-sm font-medium text-[#111b21] dark:text-white">
            Delete for me
          </p>

          <span className="text-xs text-gray-500">
            This message will only be removed from your chat.
          </span>
        </button>

        {/* Delete for everyone */}
        <button
          onClick={() => deleteMessage("everyone")}
          className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all mt-1"
        >
          <p className="text-sm font-medium text-red-500">
            Delete for everyone
          </p>

          <span className="text-xs text-gray-500">
            This message will be removed for everyone.
          </span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-[#2f3b43] flex justify-end">
        <button className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a3942] transition-all">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default DeleteMessage;
