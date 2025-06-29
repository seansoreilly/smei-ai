"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MessageSquarePlus, Mail, Loader2 } from "lucide-react";
import { Message } from "@/lib/db";
import { MessageItem } from "./MessageItem";
import { InputBox } from "./InputBox";
import { Avatar } from "./Avatar";

interface ChatInterfaceProps {
  guid: string;
}

export function ChatInterface({ guid }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        console.error("Failed to fetch messages:", error);
      }
    };

    fetchMessages();
  }, [guid]);

  const handleNewChat = () => {
    const newGuid = crypto.randomUUID();
    router.push(`/${newGuid}`);
  };

  const handleSendToSMEC = async () => {
    if (messages.length === 0) {
      alert("No conversation to send. Please start chatting first.");
      return;
    }

    setIsSending(true);
    try {
      // First, try to export as PDF
      const response = await fetch(`/api/export/pdf/${guid}`, {
        method: "POST",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `smec-consultation-${guid.slice(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        alert(
          "Conversation exported successfully! Please send the downloaded PDF to your SMEC representative."
        );
      } else {
        // Fallback: create a simple text export
        const conversationText = messages
          .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
          .join("\n\n");

        const blob = new Blob([conversationText], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `smec-consultation-${guid.slice(0, 8)}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        alert(
          "Conversation exported as text file! Please send this to your SMEC representative."
        );
      }
    } catch (error) {
      console.error("Failed to send to SMEC:", error);
      alert("Failed to export conversation. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: guid,
      role: "user",
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const assistantMessageId = crypto.randomUUID();
    let assistantContent = "";
    let assistantMessageAdded = false;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guid,
          message: content.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              setIsLoading(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantContent += parsed.content;

                // Add the assistant message only when we first receive content
                if (!assistantMessageAdded) {
                  const assistantMessage: Message = {
                    id: assistantMessageId,
                    conversation_id: guid,
                    role: "assistant",
                    content: assistantContent,
                    created_at: new Date().toISOString(),
                  };
                  setMessages((prev) => [...prev, assistantMessage]);
                  assistantMessageAdded = true;
                } else {
                  // Update existing assistant message
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: assistantContent }
                        : msg
                    )
                  );
                }
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);

      if (!assistantMessageAdded) {
        // Add error message if no assistant message was added yet
        const errorMessage: Message = {
          id: assistantMessageId,
          conversation_id: guid,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        // Update existing assistant message with error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: "Sorry, I encountered an error. Please try again.",
                }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header with logo and action buttons */}
      <header className="flex-shrink-0 bg-white/95 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-center relative">
          {/* Logo section - centered */}
          <div className="flex items-center gap-2">
            <Image
              src="/logo-h-b.png"
              alt="SMEC Logo"
              width={400}
              height={120}
              className="object-contain"
              priority
            />
          </div>

          {/* Action buttons - positioned to the right */}
          <div className="absolute right-0 flex items-center gap-3">
            <button
              onClick={handleNewChat}
              className="w-10 h-10 bg-white text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center justify-center"
              aria-label="New Chat"
              title="New Chat - Start a new conversation"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>

            <button
              onClick={handleSendToSMEC}
              disabled={isSending || messages.length === 0}
              className="w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              aria-label="Send to SMEC"
              title={
                messages.length === 0
                  ? "Send to SMEC - Start a conversation to enable sharing"
                  : "Send to SMEC - Export and share this conversation"
              }
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Mail className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-2"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto px-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-blue-500 text-2xl">🚀</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Welcome to SMEC AI
            </h2>
            <p className="text-gray-500 mb-8">
              Your AI consulting partner for advanced technology solutions
            </p>
            
            <div className="w-full space-y-3">
              <p className="text-sm text-gray-600 mb-4">Try asking about:</p>
              <button
                onClick={() => handleSendMessage("How can AI improve crop monitoring and precision farming?")}
                className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <span className="text-gray-700">How can AI improve crop monitoring and precision farming?</span>
              </button>
              <button
                onClick={() => handleSendMessage("What AI solutions are available for medical diagnostics?")}
                className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <span className="text-gray-700">What AI solutions are available for medical diagnostics?</span>
              </button>
              <button
                onClick={() => handleSendMessage("How can I implement smart manufacturing in my facility?")}
                className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <span className="text-gray-700">How can I implement smart manufacturing in my facility?</span>
              </button>
              <button
                onClick={() => handleSendMessage("What AI training programs does SMEC offer?")}
                className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <span className="text-gray-700">What AI training programs does SMEC offer?</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-2 mb-4">
                <Avatar type="assistant" size="md" />
                <div className="bg-white rounded-2xl rounded-bl-md px-3 py-2 shadow-sm border border-gray-200 max-w-xs">
                  <div className="flex items-center space-x-1">
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                      style={{
                        animation: "typing-dot 1.4s infinite ease-in-out",
                        animationDelay: "0s",
                      }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                      style={{
                        animation: "typing-dot 1.4s infinite ease-in-out",
                        animationDelay: "0.2s",
                      }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                      style={{
                        animation: "typing-dot 1.4s infinite ease-in-out",
                        animationDelay: "0.4s",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 bg-white/95 border-t border-gray-200 px-4 py-3">
        <InputBox onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
