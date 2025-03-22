import type { SubmitChatMessageRequest } from '../client/types.gen';

type ModelInfo = {
  displayName: string;
  description: string;
};

// Map of backend model names to their display information
export const MODEL_INFO: Record<SubmitChatMessageRequest['model'], ModelInfo> = {
  'gpt-4o-mini': {
    displayName: 'GPT-4 Turbo Mini',
    description: 'Smaller, faster version of GPT-4 Turbo',
  },
  'gpt-4o': {
    displayName: 'GPT-4 Turbo',
    description: 'Latest version of GPT-4 Turbo',
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