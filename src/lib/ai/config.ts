// AI Provider Configuration
export const AI_PROVIDERS = {
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  VERCEL: "vercel",
  GOOGLE: "google",
  HUGGINGFACE: "huggingface",
} as const;

export type AIProvider = (typeof AI_PROVIDERS)[keyof typeof AI_PROVIDERS];

// Model configurations for different providers
export const MODEL_CONFIGS = {
  [AI_PROVIDERS.OPENAI]: {
    "gpt-4": {
      maxTokens: 8192,
      temperature: 0.7,
      supportsFunctions: true,
      supportsVision: true,
    },
    "gpt-4-turbo": {
      maxTokens: 128000,
      temperature: 0.7,
      supportsFunctions: true,
      supportsVision: true,
    },
    "gpt-3.5-turbo": {
      maxTokens: 4096,
      temperature: 0.7,
      supportsFunctions: true,
      supportsVision: false,
    },
  },
  [AI_PROVIDERS.ANTHROPIC]: {
    "claude-3-opus": {
      maxTokens: 200000,
      temperature: 0.7,
      supportsFunctions: true,
      supportsVision: true,
    },
    "claude-3-sonnet": {
      maxTokens: 200000,
      temperature: 0.7,
      supportsFunctions: true,
      supportsVision: true,
    },
    "claude-3-haiku": {
      maxTokens: 200000,
      temperature: 0.7,
      supportsFunctions: true,
      supportsVision: true,
    },
  },
  [AI_PROVIDERS.VERCEL]: {
    "gpt-4": {
      maxTokens: 8192,
      temperature: 0.7,
      supportsFunctions: true,
      supportsVision: true,
    },
  },
  [AI_PROVIDERS.GOOGLE]: {
    "gemini-pro": {
      maxTokens: 30720,
      temperature: 0.7,
      supportsFunctions: true,
      supportsVision: false,
    },
    "gemini-pro-vision": {
      maxTokens: 30720,
      temperature: 0.7,
      supportsFunctions: false,
      supportsVision: true,
    },
  },
} as const;

// Rate limiting configurations
export const RATE_LIMITS = {
  [AI_PROVIDERS.OPENAI]: {
    requestsPerMinute: 3500,
    tokensPerMinute: 90000,
  },
  [AI_PROVIDERS.ANTHROPIC]: {
    requestsPerMinute: 1000,
    tokensPerMinute: 100000,
  },
  [AI_PROVIDERS.VERCEL]: {
    requestsPerMinute: 100,
    tokensPerMinute: 10000,
  },
  [AI_PROVIDERS.GOOGLE]: {
    requestsPerMinute: 60,
    tokensPerMinute: 32000,
  },
} as const;

// Default configurations
export const DEFAULT_CONFIG = {
  provider: AI_PROVIDERS.OPENAI as AIProvider,
  model: "gpt-4-turbo",
  temperature: 0.7,
  maxTokens: 4000,
  stream: true,
  timeout: 30000, // 30 seconds
};

// Prompt templates
export const PROMPT_TEMPLATES = {
  SYSTEM: {
    DEFAULT: "You are a helpful AI assistant.",
    CREATIVE: "You are a creative AI assistant that helps with writing and brainstorming.",
    TECHNICAL:
      "You are a technical AI assistant with expertise in programming and software development.",
    ANALYTICAL: "You are an analytical AI assistant that helps with data analysis and research.",
  },
  USER: {
    CONTEXT_TEMPLATE: "Context: {context}\n\nQuestion: {question}",
    CHAT_TEMPLATE: "{message}",
    COMPLETION_TEMPLATE: "Complete the following: {prompt}",
  },
} as const;

// Function definitions for AI models that support function calling
export const FUNCTION_DEFINITIONS = {
  GET_CURRENT_TIME: {
    name: "get_current_time",
    description: "Get the current date and time",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  SEARCH_WEB: {
    name: "search_web",
    description: "Search the web for information",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return",
          default: 5,
        },
      },
      required: ["query"],
    },
  },
  ANALYZE_IMAGE: {
    name: "analyze_image",
    description: "Analyze an image and describe its contents",
    parameters: {
      type: "object",
      properties: {
        image_url: {
          type: "string",
          description: "URL of the image to analyze",
        },
        analysis_type: {
          type: "string",
          enum: ["description", "objects", "text", "sentiment"],
          description: "Type of analysis to perform",
          default: "description",
        },
      },
      required: ["image_url"],
    },
  },
} as const;

// Error types
export const AI_ERRORS = {
  INVALID_API_KEY: "invalid_api_key",
  RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",
  INSUFFICIENT_QUOTA: "insufficient_quota",
  MODEL_NOT_FOUND: "model_not_found",
  INVALID_REQUEST: "invalid_request",
  NETWORK_ERROR: "network_error",
  TIMEOUT: "timeout",
  UNKNOWN: "unknown",
} as const;

export type AIError = (typeof AI_ERRORS)[keyof typeof AI_ERRORS];
