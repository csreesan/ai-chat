import React, { useState, KeyboardEvent, ChangeEvent, FormEvent } from 'react';
import type { Model } from '../client/types.gen';
import { AVAILABLE_MODELS } from '../constants/models';
import styles from './TextInput.module.css';

interface TextInputProps {
  onSubmit: (message: string, model: Model) => void;
  onCompareSubmit: (message: string, models: Model[]) => void;
  disabled: boolean;
  placeholder?: string;
}

const TextInput: React.FC<TextInputProps> = ({ 
  onSubmit, 
  onCompareSubmit,
  disabled,
  placeholder = "Message..." 
}) => {
  const defaultModel: Model = AVAILABLE_MODELS[0].value as Model;
  const [inputValue, setInputValue] = useState<string>('');
  const [model, setModel] = useState<Model>(defaultModel);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [secondModel, setSecondModel] = useState<Model>(AVAILABLE_MODELS[1].value as Model);

  // Add effect to ensure different models when compare mode is enabled
  React.useEffect(() => {
    if (compareMode && model === secondModel) {
      // Find a different model to use as second model
      const differentModel = AVAILABLE_MODELS.find(m => m.value !== model)?.value as Model;
      setSecondModel(differentModel);
    }
  }, [compareMode, model, secondModel]);

  const submitFunc = () => {
    if (inputValue.trim()) {
      if (compareMode) {
        onCompareSubmit(inputValue, [model, secondModel]);
      } else {
        onSubmit(inputValue, model);
      }
      setInputValue('');
    }
  }
  
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitFunc();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitFunc();
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
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setModel(e.target.value as Model)}
          >
            {AVAILABLE_MODELS.filter(modelOption => 
              !compareMode || modelOption.value !== secondModel
            ).map(modelOption => (
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
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSecondModel(e.target.value as Model)}
            >
              {AVAILABLE_MODELS.filter(modelOption => 
                modelOption.value !== model
              ).map(modelOption => (
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