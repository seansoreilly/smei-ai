'use client';

import { useState, useEffect, useRef } from 'react';
import { Message } from '@/lib/db';
import { MessageItem } from './MessageItem';
import { InputBox } from './InputBox';

interface ChatInterfaceProps {
  guid: string;
}

export function ChatInterface({ guid }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages/${guid}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();
  }, [guid]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: guid,
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const assistantMessageId = crypto.randomUUID();
    let assistantContent = '';

    const assistantMessage: Message = {
      id: assistantMessageId,
      conversation_id: guid,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guid,
          message: content.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              setIsLoading(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantContent += parsed.content;
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: assistantContent }
                      : msg
                  )
                );
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-smecai-white dark:bg-smecai-dark-blue">
      <header className="flex-shrink-0 border-b border-smecai-light-gray dark:border-smecai-blue p-4">
        <div className="flex items-center gap-3">
          <img src="/logo-h-b.png" alt="SMEC AI" className="h-8 w-auto" />{/* eslint-disable-line @next/next/no-img-element */}
        </div>
      </header>
      
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="text-center text-smecai-gray dark:text-smecai-light-gray mt-8">
            <p>Start a conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-smecai-light-gray dark:bg-smecai-blue rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-smecai-gray rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-smecai-gray rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-smecai-gray rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="flex-shrink-0 border-t border-smecai-light-gray dark:border-smecai-blue p-4">
        <InputBox onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}