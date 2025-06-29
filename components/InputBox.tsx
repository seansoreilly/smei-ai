"use client";

import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface InputBoxProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function InputBox({ onSend, disabled = false }: InputBoxProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className="w-full resize-none rounded-3xl border border-gray-300 bg-gray-100 px-4 py-3 pr-12 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{
            minHeight: "44px",
            maxHeight: "120px",
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
          }}
          aria-label="Message input"
          role="textbox"
          aria-multiline="true"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!message.trim() || disabled}
        className="w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500 transition-colors flex items-center justify-center flex-shrink-0"
        aria-label="Send message"
        title={
          !message.trim() ? "Type a message to send" : "Send message (Enter)"
        }
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}
