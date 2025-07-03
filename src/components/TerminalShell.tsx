import React from 'react';
import type { HistoryEntry } from '../types';

interface TerminalShellProps {
  history: HistoryEntry[];
  currentPath: string;
  promptSymbol: string;
  defaultPath: string;
  input: string;
  cursorVisible: boolean;
  completions: string[];
  completionIndex: number;
  terminalBodyRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
  onCompletionClick: (completion: string) => void;
}

const TerminalShell: React.FC<TerminalShellProps> = ({
  history,
  currentPath,
  promptSymbol,
  defaultPath,
  input,
  cursorVisible,
  completions,
  completionIndex,
  terminalBodyRef,
  inputRef,
  onInputChange,
  onKeyDown,
  onFocus,
  onBlur,
  onCompletionClick
}) => {
  return (
    <div className="terminal-shell-content" ref={terminalBodyRef}>
      {history.map((line, index) => (
        <div key={index} className={`terminal-line ${line.type}`}>
          {line.type === 'input' && <span className="prompt">{line.path || defaultPath} {promptSymbol} </span>}
          {line.content}
        </div>
      ))}
      <div className="input-line">
        <span className="prompt">{currentPath} {promptSymbol} </span>
        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            className="terminal-input-hidden"
            value={input}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            autoFocus
            onFocus={onFocus}
            onBlur={onBlur}
          />
          <span className="input-text">{input}</span>
          {cursorVisible && <span className="cursor"></span>}
        </div>
      </div>
      {completions.length > 0 && (
        <div className="completions">
          {completions.map((comp, index) => (
            <span
              key={comp}
              className={`completion-item ${index === completionIndex ? 'selected' : ''}`}
              onClick={() => onCompletionClick(comp)}
            >
              {comp}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TerminalShell;
