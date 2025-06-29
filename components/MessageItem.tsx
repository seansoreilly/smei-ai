import ReactMarkdown from 'react-markdown';
import { Message } from '@/lib/db';

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';
  
  return (
    <div 
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      role="article"
      aria-label={`${isUser ? 'Your' : 'Assistant'} message`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          isUser
            ? 'bg-smecai-blue text-smecai-white ml-4'
            : 'bg-smecai-light-gray dark:bg-smecai-blue text-smecai-black dark:text-smecai-white mr-4'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:my-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        <div 
          className={`text-xs mt-2 opacity-70 ${
            isUser ? 'text-smecai-light-gray' : 'text-smecai-gray dark:text-smecai-light-gray'
          }`}
        >
          {new Date(message.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}