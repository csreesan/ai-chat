import React, { useState, KeyboardEvent, ChangeEvent, FormEvent } from 'react';
import type { SubmitChatMessageRequest } from '../client/types.gen';
import { AVAILABLE_MODELS } from '../constants/models';
import styles from './TextInput.module.css';

interface TextInputProps {
  onSubmit: (message: string, model: SubmitChatMessageRequest['model']) => void;
  disabled: boolean;
  placeholder?: string;
}

const TextInput: React.FC<TextInputProps> = ({ 
  onSubmit, 
  disabled,
  placeholder = "Message..." 
}) => {
  const defaultModel: SubmitChatMessageRequest['model'] = AVAILABLE_MODELS[0].value as SubmitChatMessageRequest['model'];
  const [inputValue, setInputValue] = useState<string>('');
  const [model, setModel] = useState<SubmitChatMessageRequest['model']>(defaultModel);
  
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue, model);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        onSubmit(inputValue, model);
        setInputValue('');
      }
    }
  };

  return (
    <div className={styles.inputContainer}>
      <form onSubmit={handleSubmit}>
        <textarea
          value={inputValue}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className={styles.textarea}
        />
        <div className={styles.buttonsContainer}>
          <select
            className={styles.modelSelect}
            disabled={disabled}
            value={model}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setModel(e.target.value as SubmitChatMessageRequest['model'])}
          >
            {AVAILABLE_MODELS.map(model => (
              <option key={model.value} value={model.value} title={model.description}>
                {model.displayName}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!inputValue.trim() || disabled}
            className={`${styles.submitButton} ${!inputValue.trim() || disabled ? styles.disabled : ''}`}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default TextInput;