import React, { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import { VscTerminal } from "react-icons/vsc";
import { FaRegWindowMaximize } from "react-icons/fa";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import { initializeContent, ContentCollection, fallbackContent } from './utils/contentLoader';


// ASCII digit patterns for the clock
const ASCII_DIGITS = {
  '0': [
    ' ███ ',
    '█   █',
    '█   █',
    '█   █',
    ' ███ '
  ],
  '1': [
    '  █  ',
    ' ██  ',
    '  █  ',
    '  █  ',
    ' ███ '
  ],
  '2': [
    ' ███ ',
    '    █',
    ' ███ ',
    '█    ',
    ' ███ '
  ],
  '3': [
    ' ███ ',
    '    █',
    ' ███ ',
    '    █',
    ' ███ '
  ],
  '4': [
    '█   █',
    '█   █',
    ' ████',
    '    █',
    '    █'
  ],
  '5': [
    ' ███ ',
    '█    ',
    ' ███ ',
    '    █',
    ' ███ '
  ],
  '6': [
    ' ███ ',
    '█    ',
    ' ███ ',
    '█   █',
    ' ███ '
  ],
  '7': [
    ' ███ ',
    '    █',
    '   █ ',
    '  █  ',
    ' █   '
  ],
  '8': [
    ' ███ ',
    '█   █',
    ' ███ ',
    '█   █',
    ' ███ '
  ],
  '9': [
    ' ███ ',
    '█   █',
    ' ████',
    '    █',
    ' ███ '
  ],
  ':': [
    '     ',
    '  █  ',
    '     ',
    '  █  ',
    '     '
  ]
};

const ASCIIClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const renderASCIITime = () => {
    const timeString = formatTime(currentTime);
    const lines = ['', '', '', '', ''];

    for (let i = 0; i < timeString.length; i++) {
      const char = timeString[i];
      const pattern = ASCII_DIGITS[char as keyof typeof ASCII_DIGITS];
      
      if (pattern) {
        for (let lineIndex = 0; lineIndex < 5; lineIndex++) {
          lines[lineIndex] += pattern[lineIndex] + ' ';
        }
      }
    }

    return lines;
  };

  const asciiLines = renderASCIITime();

  return (
    <div className="ascii-clock">
      {asciiLines.map((line, index) => (
        <div key={index} className="ascii-line">
          {line}
        </div>
      ))}
    </div>
  );
};

const MatrixRain: React.FC = () => {
  const [columns, setColumns] = useState<Array<{
    chars: string[];
    positions: number[];
    speeds: number[];
    opacity: number[];
  }>>([]);

  // Cache character set and pre-compute random indices for better performance
  const charactersRef = useRef('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?');
  const characterIndicesRef = useRef<number[]>([]);
  const randomIndexCounterRef = useRef(0);

  // Pre-generate a pool of random character indices to avoid repeated calculations
  const generateRandomIndices = useCallback(() => {
    const indices = [];
    for (let i = 0; i < 1000; i++) {
      indices.push(Math.floor(Math.random() * charactersRef.current.length));
    }
    return indices;
  }, []);

  // Optimized function to get next random character using pre-generated indices
  const getRandomCharacter = useCallback(() => {
    if (characterIndicesRef.current.length === 0 || randomIndexCounterRef.current >= characterIndicesRef.current.length) {
      characterIndicesRef.current = generateRandomIndices();
      randomIndexCounterRef.current = 0;
    }
    const char = charactersRef.current[characterIndicesRef.current[randomIndexCounterRef.current]];
    randomIndexCounterRef.current++;
    return char;
  }, [generateRandomIndices]);

  useEffect(() => {
    // Initialize random character pool
    characterIndicesRef.current = generateRandomIndices();
    
    // Calculate number of columns to fill the entire screen width
    const numColumns = Math.floor(window.innerWidth / 12);
    
    const initColumns = () => {
      const newColumns = [];
      for (let i = 0; i < numColumns; i++) {
        const columnHeight = Math.floor(Math.random() * 30) + 15; // Random height between 15-45
        newColumns.push({
          chars: Array(columnHeight).fill('').map(() => getRandomCharacter()),
          positions: Array(columnHeight).fill(0).map((_, idx) => idx * -25 - Math.random() * 200), // Stagger initial positions
          speeds: Array(columnHeight).fill(0).map(() => Math.random() * 3 + 1), // Random speed 1-4
          opacity: Array(columnHeight).fill(0).map(() => Math.random() * 0.6 + 0.1) // More variation in opacity
        });
      }
      setColumns(newColumns);
    };

    initColumns();
    
    // Use requestAnimationFrame for smoother animations and better performance
    let animationId: number;
    let lastTime = 0;
    const targetInterval = 500; // Target 60ms interval
    
    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= targetInterval) {
        // Only update if page is visible to save CPU
        if (!document.hidden) {
          setColumns(prevColumns => 
            prevColumns.map(column => ({
              ...column,
              positions: column.positions.map((pos, idx) => {
                const newPos = pos + column.speeds[idx];
                // Reset position when it goes off screen with some randomization
                return newPos > window.innerHeight + 100 ? -Math.random() * 300 - 50 : newPos;
              }),
              // Optimized character changes - only change 5% of characters and reuse existing ones
              chars: column.chars.map((existingChar) => 
                Math.random() < 0.05 ? getRandomCharacter() : existingChar
              )
            }))
          );
        }
        lastTime = currentTime;
      }
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);

    // Handle window resize to recalculate columns
    const handleResize = () => {
      initColumns();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [getRandomCharacter, generateRandomIndices]);

  return (
    <div className="matrix-rain">
      {columns.map((column, colIndex) => (
        <MatrixColumn 
          key={colIndex} 
          column={column} 
          colIndex={colIndex} 
        />
      ))}
    </div>
  );
};

// Memoized component for individual matrix columns to prevent unnecessary re-renders
const MatrixColumn = React.memo<{
  column: {
    chars: string[];
    positions: number[];
    opacity: number[];
  };
  colIndex: number;
}>(({ column, colIndex }) => (
  <div className="matrix-column" style={{ left: `${colIndex * 12}px` }}>
    {column.chars.map((char, charIndex) => (
      <div
        key={`${colIndex}-${charIndex}`}
        className="matrix-char"
        style={{
          top: `${column.positions[charIndex]}px`,
          opacity: column.opacity[charIndex]
        }}
      >
        {char}
      </div>
    ))}
  </div>
));


interface TerminalLine {
  type: 'input' | 'output' | 'error'
  content: string
  timestamp?: Date
}

interface DraggableWindowState {
  id: number;
  title: string;
  content: string[];
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  isClosing?: boolean;
  isMarkdown?: boolean;
  markdownContent?: string;
}

interface WindowSwitcherProps {
  items: { id: number | 'terminal'; title: string }[];
  selectedIndex: number;
  isVisible: boolean;
}

const KeyInstructions = () => (
  <div className="key-instructions-statusbar">
    <span><b>Move:</b> <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Arrows</kbd>/<kbd>HJKL</kbd></span>
    <span className="separator" />
    <span><b>Resize:</b> <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Arrows</kbd>/<kbd>HJKL</kbd></span>
    <span className="separator" />
    <span><b>Switch:</b> <kbd>Alt</kbd>+<kbd>J</kbd>/<kbd>K</kbd></span>
    <span className="separator" />
    <span><b>Scroll:</b> <kbd>J</kbd>/<kbd>K</kbd> or <kbd>↑</kbd>/<kbd>↓</kbd></span>
    <span className="separator" />
    <span><b>Close:</b> <kbd>Esc</kbd></span>
  </div>
);

const DraggableWindow: React.FC<{
  id: number;
  title: string;
  content: string[];
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  isClosing: boolean;
  onClose: (id: number) => void;
  onFocus: (id: number) => void;
  onMove: (id: number, pos: { x: number; y: number }) => void;
  isFocused: boolean;
  isMarkdown?: boolean;
  markdownContent?: string;
}> = ({ id, title, content, x, y, z, width, height, isClosing, onClose, onFocus, onMove, isFocused, isMarkdown, markdownContent }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ((e.target as HTMLElement).closest('.window-header')) {
      onFocus(id);
      setIsDragging(true);
      dragStartPos.current = {
        x: e.clientX - x,
        y: e.clientY - y,
      };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    onMove(id, {
      x: e.clientX - dragStartPos.current.x,
      y: e.clientY - dragStartPos.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClose = () => {
    onClose(id);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onMove]);

  return (
    <div
      className={`draggable-window ${isClosing ? 'closing' : ''} ${isFocused ? 'focused' : ''} ${isMarkdown ? 'markdown-window' : ''}`}
      style={{ top: y, left: x, zIndex: z, width: `${width}px`, height: `${height}px` }}
      onMouseDown={handleMouseDown}
    >
      <div className="window-header">
        <div className="window-title">{title}</div>
        <button className="window-close-btn" onClick={handleClose}></button>
      </div>
      <div className="window-content" id={`window-content-${id}`}>
        {isMarkdown && markdownContent ? (
          <div className="markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code({ className, children }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match;
                  return !isInline ? (
                    <SyntaxHighlighter
                      style={tomorrow as any}
                      language={match[1]}
                      PreTag="div"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {markdownContent}
            </ReactMarkdown>
          </div>
        ) : (
          content.map((line, i) => (
            <div key={i} className="window-line">
              <pre>{line}</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const WindowSwitcher: React.FC<WindowSwitcherProps> = ({ items, selectedIndex, isVisible }) => {
  if (!isVisible || items.length === 0) return null;

  const finalIndex = selectedIndex % items.length;

  return (
    <div className="window-switcher-overlay">
      <div className="window-switcher">
        <ul>
          {items.map((item, index) => (
            <li key={item.id} className={index === finalIndex ? 'selected' : ''}>
              <span className="icon">
                {item.id === 'terminal' ? <VscTerminal /> : <FaRegWindowMaximize />}
              </span>
              <span className="title">{item.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

function App() {
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showCursor, setShowCursor] = useState(true)
  const [tabCompletions, setTabCompletions] = useState<string[]>([])
  const [tabIndex, setTabIndex] = useState(-1)
  const [systemInfo, setSystemInfo] = useState({
    memory: { used: 0, total: 0, percentage: 0 },
    cpu: 0,
    network: 'unknown',
    battery: null as any,
    cores: 'unknown' as string | number
  })
  const [windows, setWindows] = useState<DraggableWindowState[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switcherIndex, setSwitcherIndex] = useState(0);
  const [nextWindowId, setNextWindowId] = useState(0);
  const [zIndexCounter, setZIndexCounter] = useState(10);
  const [currentDirectory, setCurrentDirectory] = useState('~');
  const [content, setContent] = useState<{ projects: ContentCollection; articles: ContentCollection }>({
    projects: {},
    articles: {}
  });
  const [contentLoaded, setContentLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  // Load content dynamically from markdown files
  useEffect(() => {
    const loadContent = async () => {
      try {
        const dynamicContent = await initializeContent();
        setContent(dynamicContent);
        setContentLoaded(true);
      } catch (error) {
        console.warn('Failed to load dynamic content, using fallback:', error);
        setContent(fallbackContent);
        setContentLoaded(true);
      }
    };

    loadContent();
  }, []);

  const formatBoxLine = (label: string, value: string) => {
    const totalWidth = 65;
    const valueWidth = value.length;
    const labelWidth = label.length;
    const spaces = ' '.repeat(Math.max(0, totalWidth - labelWidth - valueWidth));
    return `│  ${label}${spaces}${value}  │`;
  };

  const focusWindow = useCallback((id: number) => {
    inputRef.current?.blur();
    setWindows(prev =>
      prev.map(w => (w.id === id ? { ...w, z: zIndexCounter } : w))
    );
    setZIndexCounter(prev => prev + 1);
  }, [zIndexCounter]);

  const openWindow = (title: string, content: string[] = [], isMarkdown: boolean = false, markdownContent?: string) => {
    const newWindow: DraggableWindowState = {
      id: nextWindowId,
      title,
      content,
      x: 100 + nextWindowId * 30,
      y: 100 + nextWindowId * 30,
      z: zIndexCounter,
      width: isMarkdown ? 800 : 600,
      height: isMarkdown ? 600 : 400,
      isClosing: false,
      isMarkdown,
      markdownContent
    };
    setWindows(prev => [...prev, newWindow]);
    setNextWindowId(prev => prev + 1);
    setZIndexCounter(prev => prev + 1);
    focusWindow(newWindow.id);
  };

  const getCurrentDirectoryContents = () => {
    switch (currentDirectory) {
      case '~':
        return ['about.txt', 'contact.txt', 'projects/', 'articles/'];
      case '~/projects':
        return Object.keys(content.projects);
      case '~/articles':
        return Object.keys(content.articles);
      default:
        return [];
    }
  };

  const getProjectsList = () => {
    return Object.entries(content.projects).map(([, project]) => 
      `  ${project.meta.title} (${project.meta.date}) - ${project.meta.description}`
    );
  };

  const getArticlesList = () => {
    return Object.entries(content.articles).map(([, article]) => 
      `  ${article.meta.title} (${article.meta.date}) - ${article.meta.description}`
    );
  };

  const closeWindow = (id: number) => {
    setWindows(prev =>
      prev.map(w => (w.id === id ? { ...w, isClosing: true } : w))
    );

    setTimeout(() => {
      setWindows(prev => prev.filter(w => w.id !== id));
    }, 300); // Animation duration
  };

  const moveWindow = (id: number, pos: { x: number; y: number }) => {
    setWindows(prev =>
      prev.map(w => (w.id === id ? { ...w, x: pos.x, y: pos.y } : w))
    );
  };

  const contentData = {
    about: [
      '╭─────────────────────────────────────────────────────────────────╮',
      '│                            ABOUT ME                             │',
      '├─────────────────────────────────────────────────────────────────┤',
      '│                                                                 │',
      '│  Hello! I\'m a full-stack developer passionate about creating    │',
      '│  innovative web applications and exploring cutting-edge         │',
      '│  technologies. With expertise in React, Node.js, and modern     │',
      '│  development practices, I enjoy solving complex problems        │',
      '│  and building user-centric solutions.                           │',
      '│                                                                 │',
      '│  When I\'m not coding, you\'ll find me contributing to open      │',
      '│  source projects, writing technical articles, or exploring      │',
      '│  the latest trends in software development. I believe in        │',
      '│  continuous learning and sharing knowledge with the developer   │',
      '│  community.                                                     │',
      '│                                                                 │',
      '│  By day, I\'m a passionate software developer and systems       │',
      '│  engineer building digital products. By weekend, you can       │',
      '│  find me behind a camera, brewing coffee, or on a rock         │',
      '│  climbing wall. I believe technology and creativity go          │',
      '│  hand-in-hand, and I bring that philosophy to every project    │',
      '│  I work on.                                                     │',
      '│                                                                 │',
      '│  Interests:  Open Source, Machine Learning, Photography         │',
      '│              Coffee Brewing, Rock Climbing                      │',
      '│                                                                 │',
      '╰─────────────────────────────────────────────────────────────────╯'
    ],
    contact: [
      '╭─────────────────────────────────────────────────────────────────╮',
      '│                           CONTACT INFO                          │',
      '├─────────────────────────────────────────────────────────────────┤',
      '│                                                                 │',
      '│  You can reach me through the following channels:               │',
      '│                                                                 │',
      '│  - Email:     [your-email@example.com]                          │',
      '│  - LinkedIn:  [linkedin.com/in/your-profile]                    │',
      '│  - GitHub:    [github.com/your-username]                        │',
      '│                                                                 │',
      '│  I\'m currently available for new opportunities and collaborations.│',
      '│  Feel free to send me a message!                                │',
      '│                                                                 │',
      '╰─────────────────────────────────────────────────────────────────╯'
    ]
  };

  const bioData = contentData;

  const commands = {
    help: () => [
      'Available commands:',
      '',
      '  help          - Show this help message',
      '  clear         - Clear the terminal screen',
      '  about         - Display information about me',
      '  contact       - Show contact information',
      '  projects      - List all projects',
      '  articles      - List all articles',
      '  ls            - List directory contents',
      '  cd <dir>      - Change directory (projects, articles, ~)',
      '  cat <file>    - Display file contents',
      '  pwd           - Show current directory',
      '  sysinfo       - Display system information',
      '  exit          - Close the terminal',
      '',
      'Navigation:',
      '  Use Tab for auto-completion',
      '  Use ↑/↓ arrows for command history',
      '',
      'File Management:',
      '  cd projects   - Navigate to projects directory',
      '  cd articles   - Navigate to articles directory',
      '  ls            - List files in current directory',
      '  cat <name>    - Open file or project in a window',
      ''
    ],
    clear: () => {
      setTerminalHistory([])
      return []
    },
    about: () => {
      openWindow('about.txt', bioData.about);
      return [];
    },
    contact: () => {
      openWindow('contact.txt', bioData.contact);
      return [];
    },
    projects: () => {
      if (!contentLoaded) {
        return ['Loading projects...'];
      }
      const projectsList = getProjectsList();
      return [
        'Available Projects:',
        '',
        ...projectsList,
        '',
        `Total: ${Object.keys(content.projects).length} projects`,
        '',
        'Use "cd projects" to navigate to projects directory',
        'Use "cat <project-name>" to view project details'
      ];
    },
    articles: () => {
      if (!contentLoaded) {
        return ['Loading articles...'];
      }
      const articlesList = getArticlesList();
      return [
        'Published Articles:',
        '',
        ...articlesList,
        '',
        `Total: ${Object.keys(content.articles).length} articles`,
        '',
        'Use "cd articles" to navigate to articles directory',
        'Use "cat <article-name>" to read the full article'
      ];
    },
    cd: (args: string[]) => {
      if (args.length === 0) {
        setCurrentDirectory('~');
        return [`Changed directory to: ~`];
      }
      
      const target = args[0];
      let newDir = currentDirectory;
      
      if (target === '~' || target === '/') {
        newDir = '~';
      } else if (target === '..' || target === '../') {
        if (currentDirectory !== '~') {
          newDir = '~';
        }
      } else if (target === 'projects' || target === 'projects/') {
        newDir = '~/projects';
      } else if (target === 'articles' || target === 'articles/') {
        newDir = '~/articles';
      } else {
        return [`cd: ${target}: No such directory`];
      }
      
      setCurrentDirectory(newDir);
      return [`Changed directory to: ${newDir}`];
    },
    pwd: () => [currentDirectory],
    ls: () => getCurrentDirectoryContents(),
    sysinfo: () => {
      const info = [
        '╭─────────────────────────────────────────────────────────────────╮',
        '│                          SYSTEM INFORMATION                     │',
        '├─────────────────────────────────────────────────────────────────┤',
        '│                                                                 │',
        formatBoxLine('JS Heap Memory:    ', `${systemInfo.memory.used.toFixed(2)}MB (${systemInfo.memory.percentage}% of ${systemInfo.memory.total.toFixed(2)}MB)`),
        formatBoxLine('CPU Cores:         ', `${systemInfo.cores}`),
        formatBoxLine('Network:           ', `${systemInfo.network}`),
      ]
      
      if (systemInfo.battery) {
        info.push(formatBoxLine('Battery:           ', `${systemInfo.battery.level}% ${systemInfo.battery.charging ? '⚡ Charging' : '🔋 Not Charging'}`))
      }
      
      const browserName = navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                          navigator.userAgent.includes('Firefox') ? 'Firefox' :
                          navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown'
      
      info.push(
        formatBoxLine('Browser:           ', browserName),
        formatBoxLine('User Agent:        ', navigator.userAgent.substring(0, 45) + '...'),
        formatBoxLine('Platform:          ', navigator.platform),
        formatBoxLine('Language:          ', navigator.language),
        formatBoxLine('Online:            ', navigator.onLine ? 'Yes' : 'No'),
        '│                                                                 │',
        '╰─────────────────────────────────────────────────────────────────╯'
      )
      
      return info
    }
  };

  const executeCommand = (input: string) => {
    const trimmedInput = input.trim()
    const [command, ...args] = trimmedInput.split(' ')
    
    // Add command to history
    if (trimmedInput) {
      setCommandHistory(prev => [...prev, trimmedInput])
    }

    // Reset tab completion state when executing a command
    setTabCompletions([])
    setTabIndex(-1)

    // Add input to terminal
    setTerminalHistory(prev => [...prev, {
      type: 'input',
      content: `${currentDirectory}$ ${trimmedInput}`,
      timestamp: new Date()
    }])

    // Handle cat command with file argument
    if (command === 'cat' && args.length > 0) {
      const fileName = args[0];
      
      // Handle basic text files
      if (fileName.endsWith('.txt')) {
        const baseName = fileName.replace('.txt', '');
        if (baseName in contentData) {
          openWindow(fileName, contentData[baseName as keyof typeof contentData]);
          return;
        }
      }
      
      // Handle projects
      if (currentDirectory === '~/projects' && fileName in content.projects) {
        const project = content.projects[fileName];
        openWindow(project.meta.title, [], true, project.content);
        return;
      }
      
      // Handle articles
      if (currentDirectory === '~/articles' && fileName in content.articles) {
        const article = content.articles[fileName];
        openWindow(article.meta.title, [], true, article.content);
        return;
      }
      
      setTerminalHistory(prev => [...prev, {
        type: 'error',
        content: `cat: ${fileName}: No such file or directory`,
        timestamp: new Date()
      }]);
      
      // Add empty line for spacing
      setTerminalHistory(prev => [...prev, {
        type: 'output',
        content: '',
        timestamp: new Date()
      }]);
      return;
    }

    // Handle cd command
    if (command === 'cd') {
      const result = commands.cd(args);
      setTerminalHistory(prev => [...prev, ...result.map(line => ({
        type: 'output' as const,
        content: line,
        timestamp: new Date()
      }))]);
      
      // Add empty line for spacing
      setTerminalHistory(prev => [...prev, {
        type: 'output',
        content: '',
        timestamp: new Date()
      }]);
      return;
    }

    // Handle exit command
    if (command === 'exit') {
      setTerminalHistory(prev => [...prev, {
        type: 'output',
        content: 'Goodbye!',
        timestamp: new Date()
      }])
      setTimeout(() => window.close(), 1000)
      return
    }

    // Handle other commands
    if (command in commands && typeof commands[command as keyof typeof commands] === 'function') {
      const commandFunc = commands[command as keyof typeof commands] as () => string[];
      const result = commandFunc();
      if (result.length > 0) {
        setTerminalHistory(prev => [...prev, ...result.map(line => ({
          type: 'output' as const,
          content: line,
          timestamp: new Date()
        }))])
      }
    } else if (trimmedInput) {
      setTerminalHistory(prev => [...prev, {
        type: 'error',
        content: `Command not found: ${command}. Type "help" for available commands.`,
        timestamp: new Date()
      }])
    }

    // Add empty line for spacing
    setTerminalHistory(prev => [...prev, {
      type: 'output',
      content: '',
      timestamp: new Date()
    }])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentInput)
      setCurrentInput('')
      setHistoryIndex(-1)
      setTabCompletions([])
      setTabIndex(-1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex])
      }
      setTabCompletions([])
      setTabIndex(-1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setCurrentInput('')
      }
      setTabCompletions([])
      setTabIndex(-1)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      handleTabCompletion()
    }
  }

  const handleTabCompletion = () => {
    const parts = currentInput.split(' ');
    const lastPart = parts[parts.length - 1];

    if (parts.length === 1) {
      // Complete command names
      const availableCommands = Object.keys(commands);
      const matches = availableCommands.filter(cmd => cmd.startsWith(lastPart));
      
      if (matches.length === 1) {
        setCurrentInput(matches[0] + ' ');
        setTabCompletions([]);
        setTabIndex(-1);
      } else if (matches.length > 1) {
        setTabCompletions(matches);
        setTabIndex(0);
      }
    } else if (parts[0] === 'cd' && parts.length === 2) {
      // Complete directory names
      const directories = ['~', 'projects', 'articles'];
      if (currentDirectory !== '~') {
        directories.push('..');
      }
      const matches = directories.filter(dir => dir.startsWith(lastPart));
      
      if (matches.length === 1) {
        parts[parts.length - 1] = matches[0];
        setCurrentInput(parts.join(' ') + ' ');
        setTabCompletions([]);
        setTabIndex(-1);
      } else if (matches.length > 1) {
        setTabCompletions(matches);
        setTabIndex(0);
      }
    } else if (parts[0] === 'cat' && parts.length === 2) {
      // Complete file names based on current directory
      const matches = getCurrentDirectoryContents().filter(file => file.startsWith(parts[1]))
      
      if (matches.length === 1) {
        parts[parts.length - 1] = matches[0];
        setCurrentInput(parts.join(' ') + ' ');
        setTabCompletions([]);
        setTabIndex(-1);
      } else if (matches.length > 1) {
        setTabCompletions(matches);
        setTabIndex(0);
      }
    }
  }

  const getCommandValidationClass = (input: string): string => {
    if (!input.trim()) return ''
    
    const [command] = input.trim().split(' ')
    
    if (command in commands) {
      return 'valid-command'
    }
    
    const availableCommands = Object.keys(commands)
    const hasPartialMatch = availableCommands.some(cmd => cmd.startsWith(command))
    
    return hasPartialMatch ? 'partial-command' : 'invalid-command'
  }

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Focus input on mount and when clicking on terminal
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // System information monitoring
  useEffect(() => {
    const updateSystemInfo = () => {
      // Memory information (approximated from performance API)
      if ('memory' in performance) {
        const memInfo = (performance as any).memory
        setSystemInfo(prev => ({
          ...prev,
          memory: {
            used: memInfo.usedJSHeapSize / 1024 / 1024,
            total: memInfo.totalJSHeapSize / 1024 / 1024,
            percentage: Math.round((memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100)
          }
        }))
      }

      // CPU cores
      setSystemInfo(prev => ({
        ...prev,
        cores: navigator.hardwareConcurrency || 'unknown'
      }))

      // Network status
      setSystemInfo(prev => ({
        ...prev,
        network: navigator.onLine ? 'Connected' : 'Offline'
      }))

      // Battery information (if supported)
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          setSystemInfo(prev => ({
            ...prev,
            battery: {
              level: Math.round(battery.level * 100),
              charging: battery.charging
            }
          }))
        })
      }
    }

    updateSystemInfo()
    const interval = setInterval(updateSystemInfo, 5000)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll to bottom when new content is added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalHistory])

  // Global keyboard shortcuts for window management
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Window switching with Alt+J/K
      if (e.altKey && (e.key === 'j' || e.key === 'k')) {
        e.preventDefault();
        const allItems = [
          { id: 'terminal' as const, title: 'Terminal' },
          ...windows.map(w => ({ id: w.id, title: w.title }))
        ];
        
        if (allItems.length > 1) {
          setIsSwitching(true);
          if (e.key === 'j') {
            setSwitcherIndex(prev => (prev + 1) % allItems.length);
          } else {
            setSwitcherIndex(prev => (prev - 1 + allItems.length) % allItems.length);
          }
        }
        return;
      }
      
      // Handle Enter when switching
      if (isSwitching && e.key === 'Enter') {
        e.preventDefault();
        const allItems = [
          { id: 'terminal' as const, title: 'Terminal' },
          ...windows.map(w => ({ id: w.id, title: w.title }))
        ];
        const selectedItem = allItems[switcherIndex];
        
        if (selectedItem.id === 'terminal') {
          inputRef.current?.focus();
        } else {
          focusWindow(selectedItem.id as number);
        }
        
        setIsSwitching(false);
        return;
      }
      
      // Escape to close switcher or close focused window
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isSwitching) {
          setIsSwitching(false);
        } else {
          // Close focused window
          const focusedWindow = windows.find(w => w.z === Math.max(...windows.map(win => win.z)));
          if (focusedWindow) {
            closeWindow(focusedWindow.id);
          }
        }
        return;
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [windows, isSwitching, switcherIndex, focusWindow]);

  const handleTerminalClick = () => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const focusedWindow = windows.length > 0 ? windows.reduce((prev, current) => 
    (prev.z > current.z) ? prev : current
  ) : null;

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      <MatrixRain />
      <ASCIIClock />
      
      <div className="terminal-app">
        <div className="terminal-header">
          <div className="terminal-buttons">
            <span className="btn close"></span>
            <span className="btn minimize"></span>
            <span className="btn maximize"></span>
          </div>
          <div className="terminal-title">Terminal Portfolio</div>
          <div className="terminal-time">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
        
        <div 
          className="terminal-body" 
          ref={terminalRef}
          onClick={handleTerminalClick}
        >
          {terminalHistory.map((line, index) => (
            <div
              key={index}
              className={`terminal-line ${line.type}`}
            >
              {line.content}
            </div>
          ))}
          
          <div className="input-line">
            <span className="prompt">{currentDirectory}$ </span>
            <div className="input-container">
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="terminal-input-hidden"
                autoComplete="off"
                spellCheck="false"
              />
              <span className={`input-text ${getCommandValidationClass(currentInput)}`}>
                {currentInput}
              </span>
              <span className={`cursor ${showCursor ? 'visible' : ''}`}>█</span>
            </div>
          </div>
          
          {tabCompletions.length > 0 && (
            <div className="completions">
              {tabCompletions.map((completion, index) => (
                <span
                  key={index}
                  className={`completion-item ${index === tabIndex ? 'selected' : ''}`}
                >
                  {completion}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {windows.map(window => (
        <DraggableWindow
          key={window.id}
          id={window.id}
          title={window.title}
          content={window.content}
          x={window.x}
          y={window.y}
          z={window.z}
          width={window.width}
          height={window.height}
          isClosing={window.isClosing || false}
          onClose={closeWindow}
          onFocus={focusWindow}
          onMove={moveWindow}
          isFocused={focusedWindow?.id === window.id}
          isMarkdown={window.isMarkdown}
          markdownContent={window.markdownContent}
        />
      ))}

      <WindowSwitcher
        items={[
          { id: 'terminal', title: 'Terminal' },
          ...windows.map(w => ({ id: w.id, title: w.title }))
        ]}
        selectedIndex={switcherIndex}
        isVisible={isSwitching}
      />

      <KeyInstructions />
    </div>
  )
}

export default App
