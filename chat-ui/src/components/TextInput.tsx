import React, { useState, KeyboardEvent, ChangeEvent, FormEvent } from 'react';
import styles from './TextInput.module.css';

interface TextInputProps {
  onSubmit: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}

const TextInput: React.FC<TextInputProps> = ({ 
  onSubmit, 
  disabled,
  placeholder = "Message..." 
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        onSubmit(inputValue);
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
        <button
          type="submit"
          disabled={!inputValue.trim() || disabled}
          className={`${styles.submitButton} ${!inputValue.trim() || disabled ? styles.disabled : ''}`}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default TextInput;