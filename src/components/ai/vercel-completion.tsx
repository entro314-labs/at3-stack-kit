"use client";

import { Copy, Loader2, RefreshCw, Wand2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AIModelKey } from "@/lib/ai/vercel-client";
import { useAICompletion } from "@/lib/ai/vercel-hooks";
import { cn } from "@/lib/utils";

interface VercelCompletionProps {
  className?: string;
  title?: string;
  placeholder?: string;
  showModelSelector?: boolean;
  systemMessage?: string;
  initialModel?: AIModelKey;
  onComplete?: (prompt: string, completion: string) => void;
}

const AI_MODEL_OPTIONS: { value: AIModelKey; label: string; provider: string }[] = [
  // OpenAI
  { value: "gpt-4o", label: "GPT-4o", provider: "OpenAI" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", provider: "OpenAI" },

  // Anthropic
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { value: "claude-3-sonnet", label: "Claude 3 Sonnet", provider: "Anthropic" },
  { value: "claude-3-haiku", label: "Claude 3 Haiku", provider: "Anthropic" },

  // Google
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro", provider: "Google" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash", provider: "Google" },
];

export function VercelCompletion({
  className,
  title = "AI Text Completion",
  placeholder = "Enter your prompt here...",
  showModelSelector = true,
  systemMessage = "You are a helpful AI assistant.",
  initialModel = "gpt-4o-mini",
  onComplete,
}: VercelCompletionProps) {
  const [selectedModel, setSelectedModel] = React.useState<AIModelKey>(initialModel);
  const [copied, setCopied] = React.useState(false);

  const {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    setInput,
    setCompletion,
  } = useAICompletion({
    model: selectedModel,
    systemMessage,
    onFinish: (prompt, completion) => {
      onComplete?.(prompt, completion);
    },
    onError: (error) => {
      console.error("Completion error:", error);
    },
  });

  const handleSubmitWithModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
  };

  const handleCopy = async () => {
    if (!completion) return;

    try {
      await navigator.clipboard.writeText(completion);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleReset = () => {
    setInput("");
    setCompletion("");
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            <CardTitle>{title}</CardTitle>
          </div>
          {showModelSelector && (
            <Select
              value={selectedModel}
              onValueChange={(value) => setSelectedModel(value as AIModelKey)}
            >
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
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmitWithModel} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              value={input}
              onChange={handleInputChange}
              placeholder={placeholder}
              rows={4}
              disabled={isLoading}
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={!input.trim() || isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>

            <Button type="button" variant="outline" onClick={handleReset} disabled={isLoading}>
              <RefreshCw className="h-4 w-4" />
            </Button>

            {isLoading && (
              <Button type="button" variant="outline" onClick={stop}>
                Stop
              </Button>
            )}
          </div>
        </form>

        {error && (
          <div className="rounded-md bg-destructive/15 border border-destructive/20 px-4 py-3">
            <p className="text-sm text-destructive">Error: {error.message}</p>
          </div>
        )}

        {completion && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Generated Content</Label>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 px-2">
                <Copy className="h-4 w-4 mr-1" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <div className="rounded-md border bg-muted p-4">
              <div className="whitespace-pre-wrap text-sm">{completion}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
