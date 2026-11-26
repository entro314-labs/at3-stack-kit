// AI Provider Configuration
export const AI_PROVIDERS = {
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  HUGGINGFACE: 'huggingface',
  OPENAI: 'openai',
  VERCEL: 'vercel',
} as const

export type AIProvider = (typeof AI_PROVIDERS)[keyof typeof AI_PROVIDERS]

// Model configurations for different providers
export const MODEL_CONFIGS = {
  [AI_PROVIDERS.OPENAI]: {
    'gpt-3.5-turbo': {
      maxTokens: 4096,
      temperature: 0.7,
      supportsFunctions: true,
      supportsVision: false,
    },
    'gpt-4': {
      maxTokens: 8192,
      temperature: 0.7,
      supportsFunctions: true,
      supportsVision: true,
    },
    'gpt-4-turbo': {
      maxTokens: 128000,
      temperature: 0.7,
      supportsFunctions: true,
      supportsVision: true,
    },
  },
  [AI_PROVIDERS.ANTHROPIC]: {
    'claude-3-haiku': {
      maxTokens: 200000,
      temperature: 0.7,
      supportsFunctions: true,
      supportsVision: true,
    },
    'claude-3-opus': {
      maxTokens: 200000,
      temperature: 0.7,
      supportsFunctions: true,
      supportsVision: true,
    },
    'claude-3-sonnet': {
      maxTokens: 200000,
      temperature: 0.7,
      supportsFunctions: true,
      supportsVision: true,
    },
  },
  [AI_PROVIDERS.VERCEL]: {
    'gpt-4': {
      maxTokens: 8192,
      supportsFunctions: true,
      supportsVision: true,
      temperature: 0.7,
    },
  },
  [AI_PROVIDERS.GOOGLE]: {
    'gemini-pro': {
      maxTokens: 30720,
      supportsFunctions: true,
      supportsVision: false,
      temperature: 0.7,
    },
    'gemini-pro-vision': {
      maxTokens: 30720,
      supportsFunctions: false,
      supportsVision: true,
      temperature: 0.7,
    },
  },
} as const

// Rate limiting configurations
export const RATE_LIMITS = {
  [AI_PROVIDERS.OPENAI]: {
    requestsPerMinute: 3500,
    tokensPerMinute: 90_000,
  },
  [AI_PROVIDERS.ANTHROPIC]: {
    requestsPerMinute: 1000,
    tokensPerMinute: 100_000,
  },
  [AI_PROVIDERS.VERCEL]: {
    requestsPerMinute: 100,
    tokensPerMinute: 10_000,
  },
  [AI_PROVIDERS.GOOGLE]: {
    requestsPerMinute: 60,
    tokensPerMinute: 32_000,
  },
  [AI_PROVIDERS.HUGGINGFACE]: {
    requestsPerMinute: 100,
    tokensPerMinute: 10_000,
  },
} as const

// Default configurations
export const DEFAULT_CONFIG = {
  maxTokens: 4000,
  model: 'gpt-4-turbo',
  provider: AI_PROVIDERS.OPENAI as AIProvider,
  stream: true,
  temperature: 0.7,
  timeout: 30000, // 30 seconds
}

// Prompt templates
export const PROMPT_TEMPLATES = {
  SYSTEM: {
    ANALYTICAL: 'You are an analytical AI assistant that helps with data analysis and research.',
    CREATIVE: 'You are a creative AI assistant that helps with writing and brainstorming.',
    DEFAULT: 'You are a helpful AI assistant.',
    TECHNICAL:
      'You are a technical AI assistant with expertise in programming and software development.',
  },
  USER: {
    CHAT_TEMPLATE: '{message}',
    COMPLETION_TEMPLATE: 'Complete the following: {prompt}',
    CONTEXT_TEMPLATE: 'Context: {context}\n\nQuestion: {question}',
  },
} as const

// Function definitions for AI models that support function calling
export const FUNCTION_DEFINITIONS = {
  ANALYZE_IMAGE: {
    name: 'analyze_image',
    description: 'Analyze an image and describe its contents',
    parameters: {
      type: 'object',
      properties: {
        image_url: {
          type: 'string',
          description: 'URL of the image to analyze',
        },
        analysis_type: {
          type: 'string',
          enum: ['description', 'objects', 'text', 'sentiment'],
          description: 'Type of analysis to perform',
          default: 'description',
        },
      },
      required: ['image_url'],
    },
  },
  GET_CURRENT_TIME: {
    name: 'get_current_time',
    description: 'Get the current date and time',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  SEARCH_WEB: {
    name: 'search_web',
    description: 'Search the web for information',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 5,
        },
      },
      required: ['query'],
    },
  },
} as const

// Error types
export const AI_ERRORS = {
  INSUFFICIENT_QUOTA: 'insufficient_quota',
  INVALID_API_KEY: 'invalid_api_key',
  INVALID_REQUEST: 'invalid_request',
  MODEL_NOT_FOUND: 'model_not_found',
  NETWORK_ERROR: 'network_error',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown',
} as const

export type AIError = (typeof AI_ERRORS)[keyof typeof AI_ERRORS]
