"use client";

import { Bot, Loader2, RefreshCw, Send, User } from "lucide-react";
import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type UseChatOptions, useChat } from "@/lib/ai/hooks";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps extends UseChatOptions {
  className?: string;
  placeholder?: string;
  height?: string;
  showAvatar?: boolean;
}

export function ChatInterface({
  className,
  placeholder = "Type your message...",
  height = "h-96",
  showAvatar = true,
  ...chatOptions
}: ChatInterfaceProps) {
  const [input, setInput] = React.useState("");
  const { messages, isLoading, error, sendMessage, clearMessages, abort } = useChat(chatOptions);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <span className="font-semibold">AI Assistant</span>
          </div>
          <Button variant="ghost" size="sm" onClick={clearMessages} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea ref={scrollAreaRef} className={cn("px-6", height)}>
          <div className="space-y-4 pb-4">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <p>Start a conversation with the AI assistant</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && showAvatar && (
                  <Avatar className="h-8 w-8 mt-0.5">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className="mt-1">
                    <time className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                </div>

                {message.role === "user" && showAvatar && (
                  <Avatar className="h-8 w-8 mt-0.5">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                {showAvatar && (
                  <Avatar className="h-8 w-8 mt-0.5">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">AI is typing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="shrink-0 pt-3">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim() || isLoading} size="icon">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
          {isLoading && (
            <Button type="button" variant="outline" onClick={abort} size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </form>
      </CardFooter>

      {error && (
        <div className="px-6 pb-4">
          <div className="rounded-md bg-destructive/15 border border-destructive/20 px-3 py-2">
            <p className="text-sm text-destructive">Error: {error.message}</p>
          </div>
        </div>
      )}
    </Card>
  );
}
