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
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [secondModel, setSecondModel] = useState<SubmitChatMessageRequest['model']>(defaultModel);
  
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
        <div className={styles.configContainer}>
          <div className={styles.buttonsContainer}>
            <button
              type="submit"
            disabled={!inputValue.trim() || disabled}
            className={`${styles.submitButton} ${!inputValue.trim() || disabled ? styles.disabled : ''}`}
          >
            Send
          </button>
          <select
            className={styles.modelSelect}
            disabled={disabled}
            value={model}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setModel(e.target.value as SubmitChatMessageRequest['model'])}
          >
            {AVAILABLE_MODELS.map(modelOption => (
              <option key={modelOption.value} value={modelOption.value} title={modelOption.description}>
                {modelOption.displayName}
              </option>
            ))}
          </select>

          {compareMode && (
            <select
              className={styles.modelSelect}
              disabled={disabled}
              value={secondModel}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSecondModel(e.target.value as SubmitChatMessageRequest['model'])}
            >
              {AVAILABLE_MODELS.map(modelOption => (
                <option key={modelOption.value} value={modelOption.value} title={modelOption.description}>
                  {modelOption.displayName}
                </option>
              ))}
            </select>
          )}
          </div>
          <div className={styles.toggleContainer}>
            <span className={styles.toggleLabel}>Comparison Mode</span>
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={compareMode}
                onChange={() => setCompareMode(!compareMode)}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TextInput;