"use client";

import { useChat, useCompletion } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import type { AIModelKey } from "./vercel-client";

// Enhanced useChat hook with model selection
export function useAIChat(options?: {
  model?: AIModelKey;
  systemMessage?: string;
  onError?: (error: Error) => void;
}) {
  return useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        model: options?.model || "gpt-4o-mini",
        systemMessage: options?.systemMessage,
      }),
    }),
    ...(options?.onError && { onError: options.onError }),
  });
}

// Enhanced useCompletion hook with model selection
export function useAICompletion(options?: {
  model?: AIModelKey;
  systemMessage?: string;
  onFinish?: (prompt: string, completion: string) => void;
  onError?: (error: Error) => void;
}) {
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
  } = useCompletion({
    api: "/api/completion",
    body: {
      model: options?.model || "gpt-4o-mini",
      systemMessage: options?.systemMessage,
    },
    ...(options?.onFinish && { onFinish: options.onFinish }),
    ...(options?.onError && { onError: options.onError }),
  });

  return {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    setInput,
    setCompletion,
  };
}

// Custom hook for AI text generation with server actions
export function useAIGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const generate = async (
    prompt: string,
    model: AIModelKey = "gpt-4o-mini",
    systemMessage?: string
  ) => {
    setIsGenerating(true);
    setError(null);
    setResult("");

    try {
      const { generateAIText } = await import("./vercel-client");
      const response = await generateAIText(prompt, model, systemMessage);

      if (response.success && response.text) {
        setResult(response.text);
      } else {
        setError(response.error || "Generation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setResult("");
    setError(null);
  };

  return {
    result,
    isGenerating,
    error,
    generate,
    reset,
  };
}

// Custom hook for streaming AI responses
export function useAIStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const startStream = async (
    prompt: string,
    model: AIModelKey = "gpt-4o-mini",
    systemMessage?: string
  ) => {
    setIsStreaming(true);
    setError(null);
    setStreamedText("");

    try {
      const { streamAIText } = await import("./vercel-client");
      const response = await streamAIText(prompt, model, systemMessage);

      if (!response.success) {
        throw new Error(response.error);
      }

      const { textStream } = response;

      // Read from the stream
      if (textStream) {
        for await (const delta of textStream) {
          setStreamedText((prev) => prev + delta);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Streaming failed");
    } finally {
      setIsStreaming(false);
    }
  };

  const reset = () => {
    setStreamedText("");
    setError(null);
  };

  return {
    streamedText,
    isStreaming,
    error,
    startStream,
    reset,
  };
}

// Hook for structured data generation
export function useAIObject<T>() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async (
    prompt: string,
    schema: any,
    model: AIModelKey = "gpt-4o-mini",
    systemMessage?: string
  ) => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const { generateAIObject } = await import("./vercel-client");
      const response = await generateAIObject(prompt, schema, model, systemMessage);

      if (response.success && response.object) {
        setResult(response.object as T);
      } else {
        setError(response.error || "Object generation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return {
    result,
    isGenerating,
    error,
    generate,
    reset,
  };
}

// Hook for AI assistant with tools
export function useAIAssistant(_assistantId: string) {
  // Placeholder implementation - useAssistant not imported
  return {
    status: "awaiting_message" as const,
    messages: [],
    input: "",
    handleInputChange: () => {},
    submitMessage: () => {},
    error: null,
    isLoading: false,
  };
}
