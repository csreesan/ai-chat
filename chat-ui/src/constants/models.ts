import type { SubmitChatMessageRequest } from '../client/types.gen';

type ModelInfo = {
  displayName: string;
  description: string;
};

// Map of backend model names to their display information
export const MODEL_INFO: Record<SubmitChatMessageRequest['model'], ModelInfo> = {
  'gpt-3.5-turbo': {
    displayName: 'GPT-3.5 Turbo',
    description: 'Latest version of GPT-3.5 Turbo',
  },
  'gpt-4-turbo': {
    displayName: 'GPT-4 Turbo',
    description: 'Latest version of GPT-4 Turbo',
  },
  'gpt-4o': {
    displayName: 'GPT-4o',
    description: 'Latest version of GPT-4o',
  },
  'gpt-4o-mini': {
    displayName: 'GPT-4o Mini',
    description: 'Smaller, faster version of GPT-4o',
  },
  'gpt-4.5-preview': {
    displayName: 'GPT-4.5 Preview',
    description: 'Latest version of GPT-4.5 Preview',
  },
  'o1': {
    displayName: 'o1',
    description: 'Latest version of o1',
  },
  'o1-mini': {
    displayName: 'o1 Mini',
    description: 'Smaller, faster version of o1',
  },
  'o3-mini': {
    displayName: 'o3 Mini',
    description: 'Smaller, faster version of o3',
  },
  'claude-2.1': {
    displayName: 'Claude 2.1',
    description: 'Latest version of Claude 2.1',
  },
  'claude-3-opus-20240229': {
    displayName: 'Claude 3 Opus',
    description: 'Latest version of Claude 3 Opus',
  },
  'claude-3-5-haiku-20241022': {
    displayName: 'Claude 3.5 Haiku',
    description: 'Latest version of Claude 3.5 Haiku',
  },
  'claude-3-7-sonnet-20250219': {
    displayName: 'Claude 3.7 Sonnet',
    description: 'Latest version of Claude 3.7 Sonnet',
  },
  'claude-3-5-sonnet-20241022': {
    displayName: 'Claude 3.5 Sonnet',
    description: 'Stable version of Claude 3.5 Sonnet',
  },
} as const;

// Helper function to get display name from backend model name
export const getModelDisplayName = (modelName: SubmitChatMessageRequest['model']): string => {
  return MODEL_INFO[modelName].displayName;
};

// Helper function to get model description from backend model name
export const getModelDescription = (modelName: SubmitChatMessageRequest['model']): string => {
  return MODEL_INFO[modelName].description;
};

// List of all available models with their full information
export const AVAILABLE_MODELS = Object.entries(MODEL_INFO).map(([backendName, info]) => ({
  value: backendName,
  displayName: info.displayName,
  description: info.description,
})); 