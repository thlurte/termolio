import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula, materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import { loadContentFile, availableFiles, loadContentCollection } from './utils/contentLoader';
import { getTerminalConfig, getNavigationConfig, getThemeConfig, getSiteConfig } from './utils/config';
import './App.css';

interface Tab {
  id: string;
  title: string;
  content: string;
  type: 'shell' | 'content';
}

interface HistoryEntry {
  type: 'input' | 'output' | 'error';
  content: string;
  path?: string;
}

const App: React.FC = () => {
  const terminalConfig = getTerminalConfig();
  const navigationConfig = getNavigationConfig();
  const themeConfig = getThemeConfig();
  const siteConfig = getSiteConfig();
  
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([
    { type: 'output', content: terminalConfig.welcome_message }
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'shell', title: 'Shell', content: '', type: 'shell' }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('shell');
  const [currentPath, setCurrentPath] = useState(terminalConfig.default_path);
  const [completions, setCompletions] = useState<string[]>([]);
  const [completionIndex, setCompletionIndex] = useState(-1);
  const [showKeyInstructions, setShowKeyInstructions] = useState(true);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Set CSS custom properties based on config
    document.documentElement.style.setProperty('--terminal-font-family', themeConfig.font_family || 'monospace');
    document.documentElement.style.setProperty('--terminal-prompt-symbol', `"${terminalConfig.prompt_symbol}"`);
    document.documentElement.style.setProperty('--site-name', `"${siteConfig.name}"`);
    document.documentElement.style.setProperty('--terminal-welcome-message', `"${terminalConfig.welcome_message}"`);
  }, [terminalConfig, themeConfig]);

  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [history]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleCommand = async (command: string) => {
    const newHistory = [...history, { type: 'input' as 'input', content: command, path: currentPath }];

    if (command.trim() === '') {
      setHistory(newHistory);
      return;
    }

    let output = '';
    const [cmd, ...args] = command.trim().split(' ');

    if (cmd === 'help') {
      output = 'Available commands: help, clear, ls, cd [dir], cat [file], projects, articles';
    } else if (cmd === 'ls') {
      const currentDir = currentPath === '/' ? '' : currentPath.substring(1) + '/';
      const files = availableFiles
        .filter(f => f.startsWith(currentDir) && !f.substring(currentDir.length).includes('/'))
        .map(f => f.substring(currentDir.length));
      
      const dirs = currentPath === '/' ? ['articles/', 'projects/'] : [];
      output = [...files, ...dirs].join('  ');
    } else if (cmd === 'cd') {
      const target = args[0];
      if (!target || target === '~' || target === '/') {
        setCurrentPath('/');
      } else if (target === '..') {
        setCurrentPath('/');
      } else if (['articles', 'projects'].includes(target.replace('/', '')) && currentPath === '/') {
        setCurrentPath('/' + target.replace('/', ''));
      } else {
        output = `cd: no such file or directory: ${target}`;
      }
    } else if (cmd === 'cat') {
      const filename = args[0];
      if (!filename) {
        output = 'cat: missing operand';
      } else {
        const path = currentPath === '/' ? filename : `${currentPath.substring(1)}/${filename}`;
        try {
          const contentItem = await loadContentFile(path);
          if (contentItem) {
            const newTab: Tab = {
              id: `tab-${Date.now()}`,
              title: filename,
              content: contentItem.content,
              type: 'content',
            };
            setTabs(prevTabs => [...prevTabs, newTab]);
            setActiveTabId(newTab.id);
          } else {
            output = `cat: ${filename}: No such file or directory`;
          }
        } catch (error) {
          output = `Error: ${(error as Error).message}`;
        }
      }
    } else if (cmd === 'projects' || cmd === 'articles') {
      try {
        const items = await loadContentCollection(cmd as 'projects' | 'articles');
        output = items.map(item => item.id.replace(`${cmd}/`, '')).join('\n');
      } catch (error) {
        output = `Error: ${(error as Error).message}`;
      }
    } else if (cmd === 'clear') {
      setHistory([]);
      setInput('');
      return;
    } else {
      output = `command not found: ${command}`;
    }

    setHistory([...newHistory, { type: 'output', content: output }]);
    setInput('');
    const newCommandHistory = [command, ...commandHistory];
    // Limit history based on config
    if (newCommandHistory.length > navigationConfig.history_limit) {
      newCommandHistory.splice(navigationConfig.history_limit);
    }
    setCommandHistory(newCommandHistory);
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setCompletions([]);
      setCompletionIndex(-1);
    } else if (e.key === 'ArrowUp') {
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleAutocomplete(e);
    } else if (e.ctrlKey && e.key === 'c') {
      setInput('');
      setCompletions([]);
      setCompletionIndex(-1);
    }
  };

  const handleAutocomplete = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const commands = ['help', 'clear', 'ls', 'cd', 'cat', 'projects', 'articles'];
    const parts = input.trim().split(' ');
    const currentCommand = parts[0];

    // If cycling through existing completions
    if (completionIndex !== -1 && completions.length > 0) {
      const newIndex = (e.shiftKey ? (completionIndex - 1 + completions.length) : (completionIndex + 1)) % completions.length;
      setCompletionIndex(newIndex);
      const newParts = [...parts.slice(0, -1), completions[newIndex]];
      setInput(newParts.join(' '));
      return;
    }

    let potentialCompletions: string[] = [];
    const arg = parts.length > 1 ? parts[parts.length - 1] : '';

    if (parts.length === 1 && !input.endsWith(' ')) {
        // Command completion
        potentialCompletions = commands.filter(cmd => cmd.startsWith(currentCommand));
    } else if (currentCommand === 'cd' && (parts.length === 2 || (parts.length === 1 && input.endsWith(' ')))) {
        // Directory completion for 'cd'
        if (currentPath === '/') {
            potentialCompletions = ['articles', 'projects'].filter(dir => dir.startsWith(arg));
        }
    } else if (currentCommand === 'cat' && (parts.length === 2 || (parts.length === 1 && input.endsWith(' ')))) {
        // File completion for 'cat'
        const currentDir = currentPath === '/' ? '' : currentPath.substring(1) + '/';
        potentialCompletions = availableFiles
            .filter(f => f.startsWith(currentDir) && !f.substring(currentDir.length).includes('/'))
            .map(f => f.substring(currentDir.length))
            .filter(f => f.startsWith(arg));
    }

    if (potentialCompletions.length === 1) {
      const newParts = [...parts.slice(0, -1), potentialCompletions[0]];
      setInput(newParts.join(' ') + ' ');
      setCompletions([]);
      setCompletionIndex(-1);
    } else if (potentialCompletions.length > 1) {
      setCompletions(potentialCompletions);
      setCompletionIndex(0);
      // Set the first completion right away
      const newParts = [...parts.slice(0, -1), potentialCompletions[0]];
      setInput(newParts.join(' '));
    }
  };

  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
  };

  const handleCloseTab = (tabId: string) => {
    setTabs(tabs.filter(tab => tab.id !== tabId));
    if (activeTabId === tabId) {
      setActiveTabId('shell');
    }
  };

  const getActiveTab = () => {
    return tabs.find(tab => tab.id === activeTabId);
  };

  const getSyntaxTheme = () => {
    switch (themeConfig.syntax_highlighting) {
      case 'dracula':
        return dracula;
      case 'materialDark':
        return materialDark;
      default:
        return dracula;
    }
  };

  return (
    <div className="app-container">
      <div className="terminal-app">
        <div className="terminal-header">
          <div className="terminal-buttons">
            <span className="btn close"></span>
            <span className="btn minimize"></span>
            <span className="btn maximize"></span>
          </div>
          <span className="terminal-title">{siteConfig.name.toLowerCase()} - {getActiveTab()?.title}</span>
          <span className="terminal-time">{currentTime}</span>
        </div>
        <div className="terminal-tabs">
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`terminal-tab ${tab.id === activeTabId ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.id)}
              >
                {tab.title}
                {tab.type !== 'shell' && (
                  <button onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }} className="close-tab-btn">x</button>
                )}
              </div>
            ))}
          </div>
        <div className="terminal-body">
          <div className="tab-content active">
            {getActiveTab()?.type === 'shell' ? (
              <div className="terminal-shell-content" ref={terminalBodyRef}>
                {history.map((line, index) => (
                  <div key={index} className={`terminal-line ${line.type}`}>
                    {line.type === 'input' && <span className="prompt">{line.path || terminalConfig.default_path} {terminalConfig.prompt_symbol} </span>}
                    {line.content}
                  </div>
                ))}
                <div className="input-line">
                  <span className="prompt">{currentPath} {terminalConfig.prompt_symbol} </span>
                  <div className="input-container">
                    <input
                      ref={inputRef}
                      type="text"
                      className="terminal-input-hidden"
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      onFocus={() => setCursorVisible(true)}
                      onBlur={() => setCursorVisible(false)}
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
                        onClick={() => {
                          setInput(comp);
                          setCompletions([]);
                        }}
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return match ? (
                        <SyntaxHighlighter
                          style={getSyntaxTheme() as any}
                          language={match[1]}
                          PreTag="div"
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {getActiveTab()?.content || ''}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
      {showKeyInstructions && (
        <div className="key-instructions-statusbar">
          <span><b>Tab:</b> Autocomplete</span>
          <span className="separator"></span>
          <span><b>↑/↓:</b> Navigate History</span>
          <span className="separator"></span>
          <span><b>Ctrl+C:</b> Clear Input</span>
        </div>
      )}
    </div>
  );
};

export default App;
