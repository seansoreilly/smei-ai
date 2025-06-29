'use client';

import { useState, KeyboardEvent } from 'react';

interface InputBoxProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function InputBox({ onSend, disabled = false }: InputBoxProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-lg border border-smecai-light-gray dark:border-smecai-blue bg-smecai-white dark:bg-smecai-dark-blue px-4 py-2 text-smecai-black dark:text-smecai-white placeholder-smecai-gray dark:placeholder-smecai-light-gray focus:border-smecai-light-blue focus:outline-none focus:ring-1 focus:ring-smecai-light-blue disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          minHeight: '44px',
          maxHeight: '120px',
        }}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
        }}
        aria-label="Message input"
        role="textbox"
        aria-multiline="true"
      />
      <button
        onClick={handleSubmit}
        disabled={!message.trim() || disabled}
        className="px-4 py-2 bg-smecai-blue text-smecai-white rounded-lg hover:bg-smecai-dark-blue focus:outline-none focus:ring-2 focus:ring-smecai-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-smecai-blue transition-colors"
        aria-label="Send message"
      >
        Send
      </button>
    </div>
  );
}