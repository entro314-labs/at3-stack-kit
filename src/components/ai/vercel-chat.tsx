"use client";

import { Bot, Loader2, RefreshCw, Send, Settings, User } from "lucide-react";
import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AIModelKey } from "@/lib/ai/vercel-client";
import { useAIChat } from "@/lib/ai/vercel-hooks";
import { cn } from "@/lib/utils";

interface VercelChatProps {
  className?: string;
  placeholder?: string;
  height?: string;
  showAvatar?: boolean;
  showModelSelector?: boolean;
  systemMessage?: string;
  initialModel?: AIModelKey;
}

const AI_MODEL_OPTIONS: { value: AIModelKey; label: string; provider: string }[] = [
  // OpenAI
  { value: "gpt-4o", label: "GPT-4o", provider: "OpenAI" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", provider: "OpenAI" },
  { value: "gpt-4", label: "GPT-4", provider: "OpenAI" },

  // Anthropic
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { value: "claude-3-opus", label: "Claude 3 Opus", provider: "Anthropic" },
  { value: "claude-3-sonnet", label: "Claude 3 Sonnet", provider: "Anthropic" },
  { value: "claude-3-haiku", label: "Claude 3 Haiku", provider: "Anthropic" },

  // Google
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro", provider: "Google" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash", provider: "Google" },
];

export function VercelChat({
  className,
  placeholder = "Type your message...",
  height = "h-96",
  showAvatar = true,
  showModelSelector = true,
  systemMessage = "You are a helpful AI assistant.",
  initialModel = "gpt-4o-mini",
}: VercelChatProps) {
  const [selectedModel, setSelectedModel] = React.useState<AIModelKey>(initialModel);
  const [showSettings, setShowSettings] = React.useState(false);

  const { messages, sendMessage, status, error, stop, setMessages } = useAIChat({
    model: selectedModel,
    systemMessage,
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  const [input, setInput] = React.useState("");

  const isLoading = status === "streaming" || status === "submitted";

  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, []);

  const handleSubmitWithModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleModelChange = (newModel: AIModelKey) => {
    setSelectedModel(newModel);
    // Optionally clear messages when changing models
    // setMessages([]);
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <span className="font-semibold">AI Assistant</span>
            {showModelSelector && (
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMessages([])} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {showSettings && showModelSelector && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Model:</span>
              <Select value={selectedModel} onValueChange={handleModelChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODEL_OPTIONS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{model.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">{model.provider}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
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
                  <div className="text-sm whitespace-pre-wrap">
                    {message.parts.map((part, index) => {
                      switch (part.type) {
                        case "text":
                          return <span key={index}>{part.text}</span>;
                        default:
                          // Handle tool parts
                          if (part.type.startsWith("tool-")) {
                            const toolPart = part as any;
                            if (
                              toolPart.state === "input-streaming" ||
                              toolPart.state === "input-available"
                            ) {
                              return (
                                <div key={index} className="bg-blue-100 p-2 rounded mt-1">
                                  <small>🔧 Using tool: {part.type.replace("tool-", "")}</small>
                                  {toolPart.input && (
                                    <div className="text-xs mt-1">
                                      Input: {JSON.stringify(toolPart.input)}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            if (toolPart.state === "output-available") {
                              return (
                                <div key={index} className="bg-green-100 p-2 rounded mt-1">
                                  <small>✅ Tool result: {part.type.replace("tool-", "")}</small>
                                  <div className="text-xs mt-1">
                                    Result: {JSON.stringify(toolPart.output)}
                                  </div>
                                </div>
                              );
                            }
                            if (toolPart.state === "output-error") {
                              return (
                                <div key={index} className="bg-red-100 p-2 rounded mt-1">
                                  <small>❌ Tool error: {part.type.replace("tool-", "")}</small>
                                  <div className="text-xs mt-1">Error: {toolPart.errorText}</div>
                                </div>
                              );
                            }
                          }
                          return <span key={index}>{JSON.stringify(part)}</span>;
                      }
                    })}
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
        <form onSubmit={handleSubmitWithModel} className="flex w-full gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
            <Button type="button" variant="outline" onClick={stop} size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </form>
      </CardFooter>

      {error && (
        <div className="px-6 pb-4">
          <div className="rounded-md bg-destructive/15 border border-destructive/20 px-3 py-2">
            <p className="text-sm text-destructive">Error: {error.message}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // In v5, you need to resend the last message
                const lastUserMessage = messages.filter((m) => m.role === "user").pop();
                if (lastUserMessage) {
                  const textPart = lastUserMessage.parts.find((p) => p.type === "text");
                  if (textPart) {
                    sendMessage({ text: textPart.text });
                  }
                }
              }}
              className="mt-2 h-8 px-2"
            >
              Retry
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
