import React, { useState, KeyboardEvent, ChangeEvent, FormEvent } from 'react';
import styles from './TextInput.module.css';

interface TextInputProps {
  onSubmit: (message: string, model: string) => void;
  disabled: boolean;
  placeholder?: string;
}

const TextInput: React.FC<TextInputProps> = ({ 
  onSubmit, 
  disabled,
  placeholder = "Message..." 
}) => {
  const defaultModel = 'gpt-4o-mini';
  const [inputValue, setInputValue] = useState<string>('');
  const [model, setModel] = useState<string>(defaultModel);
  
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
            defaultValue={defaultModel}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setModel(e.target.value)}
          >
            <option value="gpt-4o-mini">GPT 4o Mini</option>
            <option value="gpt-4o">GPT 4o</option>
            <option value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet</option>
            <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
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