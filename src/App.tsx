import React, { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import { VscTerminal } from "react-icons/vsc";
import { FaRegWindowMaximize } from "react-icons/fa";


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
}> = ({ id, title, content, x, y, z, width, height, isClosing, onClose, onFocus, onMove, isFocused }) => {
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
      className={`draggable-window ${isClosing ? 'closing' : ''} ${isFocused ? 'focused' : ''}`}
      style={{ top: y, left: x, zIndex: z, width: `${width}px`, height: `${height}px` }}
      onMouseDown={handleMouseDown}
    >
      <div className="window-header">
        <div className="window-title">{title}</div>
        <button className="window-close-btn" onClick={handleClose}></button>
      </div>
      <div className="window-content" id={`window-content-${id}`}>
        {content.map((line, i) => (
          <div key={i} className="window-line">
            <pre>{line}</pre>
          </div>
        ))}
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
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

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

  const openWindow = (title: string, content: string[]) => {
    const newWindow: DraggableWindowState = {
      id: nextWindowId,
      title,
      content,
      x: window.innerWidth / 2 - 350 + windows.length * 20,
      y: window.innerHeight / 2 - 200 + windows.length * 20,
      width: 700,
      height: 400,
      z: zIndexCounter,
    };
    setWindows(prev => [...prev, newWindow]);
    setNextWindowId(prev => prev + 1);
    setZIndexCounter(prev => prev + 1);
    focusWindow(newWindow.id);
  };

  const closeWindow = (id: number) => {
    setWindows(prev =>
      prev.map(w => (w.id === id ? { ...w, isClosing: true } : w))
    );

    setTimeout(() => {
      setWindows(prev => prev.filter(w => w.id !== id));
    }, 300); // Animation duration
  };

  const moveWindow = useCallback((id: number, pos: { x: number; y: number }) => {
    setWindows(prev =>
      prev.map(w => (w.id === id ? { ...w, x: pos.x, y: pos.y } : w))
    );
  }, []);

  useEffect(() => {
    // Update system info periodically
    const interval = setInterval(() => {
      // Memory Info (Chrome only)
      const memory = (performance as any).memory;
      if (memory) {
        setSystemInfo(prev => ({
          ...prev,
          memory: {
            used: memory.usedJSHeapSize / 1048576,
            total: memory.totalJSHeapSize / 1048576,
            percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
          }
        }));
      }

      // CPU Cores
      if (navigator.hardwareConcurrency) {
        setSystemInfo(prev => ({ ...prev, cores: navigator.hardwareConcurrency }));
      }

      // Network Info
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        setSystemInfo(prev => ({ ...prev, network: connection.effectiveType }));
      }

    }, 2000);

    // Battery Info
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBatteryStatus = () => {
          setSystemInfo(prev => ({
            ...prev,
            battery: {
              level: Math.round(battery.level * 100),
              charging: battery.charging
            }
          }));
        }
        updateBatteryStatus();
        battery.addEventListener('chargingchange', updateBatteryStatus);
        battery.addEventListener('levelchange', updateBatteryStatus);
      });
    }

    return () => {
      clearInterval(interval);
      // In a real app, you'd want to remove the battery event listeners here.
    };
  }, []);

  const bioData = {
    about: [
      '╭─────────────────────────────────────────────────────────────────╮',
      '│                              ABOUT ME                           │',
      '├─────────────────────────────────────────────────────────────────┤',
      '│                                                                 │',
      '│  Name:       Adheeb Ahmed                                       │',
      '│  Title:      Software Engineer                                  │',
      '│  Location:   Colombo, Asia                                      │',
      '│  Email:      thlurte<at>gmail<dot>com                           │',
      '│  Phone:      +94 (75) 203-4272                                  │',
      '│                                                                 │',
      '│  Bio:        Hello! I\'m Adheeb. By day, I\'m a software       │',
      '│              engineer building digital products. By weekend, you  │',
      '│              can find me behind a camera, brewing coffee, or on │',
      '│              a rock climbing wall. I believe technology and     │',
      '│              creativity go hand-in-hand, and I bring that       │',
      '│              philosophy to every project I work on.             │',
      '│                                                                 │',
      '│  Interests:  Open Source, Machine Learning, Photography         │',
      '│              Coffee Brewing, Rock Climbing                      │',
      '│                                                                 │',
      '╰─────────────────────────────────────────────────────────────────╯'
    ],
    skills: [
      '╭─────────────────────────────────────────────────────────────────╮',
      '│                            TECHNICAL SKILLS                     │',
      '├─────────────────────────────────────────────────────────────────┤',
      '│                                                                 │',
      '│  Languages:     JavaScript/TypeScript ████████████ 95%         │',
      '│                 Python                 ████████░░░ 85%         │',
      '│                 Go                     ██████░░░░░ 70%         │',
      '│                 Rust                   ████░░░░░░░ 45%         │',
      '│                                                                 │',
      '│  Frontend:      React/Next.js          ████████████ 95%        │',
      '│                 Vue.js                 ███████░░░░ 75%         │',
      '│                 Svelte                 █████░░░░░░ 60%         │',
      '│                                                                 │',
      '│  Backend:       Node.js/Express        ████████████ 90%        │',
      '│                 FastAPI/Django         ████████░░░ 80%         │',
      '│                 PostgreSQL/MongoDB     ███████░░░░ 75%         │',
      '│                                                                 │',
      '│  DevOps:        Docker/Kubernetes      ████████░░░ 80%         │',
      '│                 AWS/GCP                ███████░░░░ 70%         │',
      '│                 CI/CD                  ████████░░░ 85%         │',
      '│                                                                 │',
      '╰─────────────────────────────────────────────────────────────────╯'
    ],
    experience: [
      '╭─────────────────────────────────────────────────────────────────╮',
      '│                         WORK EXPERIENCE                         │',
      '├─────────────────────────────────────────────────────────────────┤',
      '│                                                                 │',
      '│  [2023-Present] Senior Full Stack Developer @ TechCorp          │',
      '│  ├─ Lead a team of 5 developers on microservices architecture   │',
      '│  ├─ Reduced deployment time by 60% with CI/CD improvements      │',
      '│  ├─ Built real-time collaboration features serving 100k+ users  │',
      '│  └─ Tech: React, Node.js, PostgreSQL, Docker, AWS              │',
      '│                                                                 │',
      '│  [2021-2023] Frontend Developer @ StartupXYZ                    │',
      '│  ├─ Developed responsive web applications from scratch          │',
      '│  ├─ Improved page load times by 40% through optimization       │',
      '│  ├─ Implemented design system used across 8 product lines      │',
      '│  └─ Tech: Vue.js, TypeScript, Tailwind CSS, Firebase          │',
      '│                                                                 │',
      '│  [2019-2021] Junior Developer @ WebAgency                       │',
      '│  ├─ Built client websites and e-commerce platforms             │',
      '│  ├─ Collaborated with designers on pixel-perfect implementations│',
      '│  ├─ Maintained legacy PHP applications and databases           │',
      '│  └─ Tech: JavaScript, PHP, MySQL, WordPress                    │',
      '│                                                                 │',
      '╰─────────────────────────────────────────────────────────────────╯'
    ],
    projects: [
      '╭─────────────────────────────────────────────────────────────────╮',
      '│                            PROJECTS                             │',
      '├─────────────────────────────────────────────────────────────────┤',
      '│                                                                 │',
      '│  🏪 E-Commerce Platform (2023)                                  │',
      '│  ├─ Full-stack marketplace with 50k+ active users              │',
      '│  ├─ Real-time inventory management and payment processing       │',
      '│  ├─ Built with Next.js, Stripe API, PostgreSQL                 │',
      '│  └─ github.com/johndoe/ecommerce-platform                      │',
      '│                                                                 │',
      '│  📋 Task Management App (2022)                                  │',
      '│  ├─ Collaborative project management tool with real-time sync  │',
      '│  ├─ Drag-and-drop interface with custom notifications          │',
      '│  ├─ Built with React, Socket.io, MongoDB                       │',
      '│  └─ github.com/johndoe/task-manager                            │',
      '│                                                                 │',
      '│  🌤️ Weather Dashboard (2021)                                    │',
      '│  ├─ Real-time weather data with beautiful visualizations       │',
      '│  ├─ PWA with offline capability and push notifications         │',
      '│  ├─ Built with Vue.js, Chart.js, OpenWeather API              │',
      '│  └─ github.com/johndoe/weather-app                             │',
      '│                                                                 │',
      '│  💬 Chat Application (2020)                                     │',
      '│  ├─ Real-time messaging with file sharing and emoji support    │',
      '│  ├─ End-to-end encryption and group chat functionality         │',
      '│  ├─ Built with Socket.io, React, Node.js                       │',
      '│  └─ github.com/johndoe/chat-app                                │',
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
  }

  const commands = {
    help: () => [
      'Available commands:',
      '',
      '  about      - Show personal information',
      '  skills     - Display technical skills',
      '  experience - Show work experience',
      '  projects   - List my projects',
      '  contact    - Show contact information',
      '  sysinfo    - Show system information',
      '  clear      - Clear terminal screen',
      '  whoami     - Show current user',
      '  date       - Show current date and time',
      '  ls         - List available sections',
      '  cat <file> - Display content of a file',
      '  history    - Show command history',
      '  banner     - Show welcome banner',
      '  exit       - Close terminal',
      '',
      'Use arrow keys to navigate command history.'
    ],
    about: () => {
      openWindow('about.txt', bioData.about);
      return [];
    },
    skills: () => {
      openWindow('skills.txt', bioData.skills);
      return [];
    },
    experience: () => {
      openWindow('experience.txt', bioData.experience);
      return [];
    },
    projects: () => {
      openWindow('projects.txt', bioData.projects);
      return [];
    },
    contact: () => {
      openWindow('contact.txt', bioData.contact);
      return [];
    },
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
        '│                                                                 │',
        formatBoxLine('Browser:           ', browserName),
        formatBoxLine('Platform:          ', navigator.platform),
        formatBoxLine('Language:          ', navigator.language),
        '│                                                                 │',
        '╰─────────────────────────────────────────────────────────────────╯'
      )
      
      openWindow('sysinfo.txt', info);
      return [];
    },
    whoami: () => ['thlurte'],
    date: () => [new Date().toString()],
    ls: () => [
      'about.txt',
      'skills.txt', 
      'experience.txt',
      'projects.txt',
      'contact.txt'
    ],
    history: () => commandHistory.map((cmd, index) => `${index + 1}  ${cmd}`),
    cat: () => ['Usage: cat <filename>'],
    banner: () => [
      '███████╗ ██████╗ ██████╗ ████████╗██████╗  ██████╗ ██╗     ██╗ ██████╗ ',
      '██╔════╝██╔═══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔═══██╗██║     ██║██╔═══██╗',
      '██████╗ ██║   ██║██████╔╝   ██║   ██████╔╝██║   ██║██║     ██║██║   ██║',
      '██╔═══╝ ██║   ██║██╔══██╗   ██║   ██╔═══╝ ██║   ██║██║     ██║██║   ██║',
      '██║     ╚██████╔╝██║  ██║   ██║   ██║     ╚██████╔╝███████╗██║╚██████╔╝',
      '╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝ ',
      '',
      '                    Welcome to John Doe\'s Terminal Portfolio',
      '                              Type "help" for commands',
      ''
    ],
    clear: () => {
      setTerminalHistory([])
      return []
    },
    exit: () => {
      window.close()
      return ['Goodbye!']
    }
  }

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
      content: `$ ${trimmedInput}`,
      timestamp: new Date()
    }])

    // Handle cat command with file argument
    if (command === 'cat' && args.length > 0) {
      const fileName = args[0].replace('.txt', '');
      if (fileName in bioData) {
        openWindow(`${fileName}.txt`, bioData[fileName as keyof typeof bioData]);
      } else {
        setTerminalHistory(prev => [...prev, {
          type: 'error',
          content: `cat: ${args[0]}: No such file or directory`,
          timestamp: new Date()
        }])
      }
      // Add empty line for spacing
      setTerminalHistory(prev => [...prev, {
        type: 'output',
        content: '',
        timestamp: new Date()
      }])
      return
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
    if (command in commands) {
      const result = commands[command as keyof typeof commands]()
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
    } else {
      // Reset tab completion on any other key
      setTabCompletions([])
      setTabIndex(-1)
    }
  }

  // Auto-focus input and cursor blinking
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)

    return () => clearInterval(cursorTimer)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalHistory])

  // Focus input when terminal is clicked
  const handleTerminalClick = (e: React.MouseEvent) => {
    // If click is inside a window or its elements, do nothing.
    if ((e.target as HTMLElement).closest('.draggable-window')) {
      return;
    }
    inputRef.current?.focus()
  }

  const getAvailableCompletions = (input: string) => {
    const parts = input.split(' ')
    const availableCommands = Object.keys(commands)
    
    if (parts.length === 1) {
      // Command completion
      return availableCommands.filter(cmd => cmd.startsWith(parts[0]))
    } else if (parts.length === 2 && parts[0] === 'cat') {
      // File completion for cat command
      const files = ['about.txt', 'skills.txt', 'experience.txt', 'projects.txt', 'contact.txt']
      return files.filter(file => file.startsWith(parts[1]))
    }
    
    return []
  }

  const handleTabCompletion = () => {
    // If we are already cycling through completions, move to the next one
    if (tabCompletions.length > 0) {
      const nextIndex = (tabIndex + 1) % tabCompletions.length
      setTabIndex(nextIndex)

      const completion = tabCompletions[nextIndex]
      const parts = currentInput.split(' ')
      
      if (parts.length > 1 && parts[0] === 'cat') {
        setCurrentInput(`cat ${completion}`)
      } else {
        setCurrentInput(completion)
      }
      return
    }

    // Otherwise, this is the first tab press, so we get available completions
    const completions = getAvailableCompletions(currentInput)

    if (completions.length === 0) {
      return
    }

    const parts = currentInput.split(' ')

    if (completions.length === 1) {
      // Single match - auto complete
      if (parts.length > 1 && parts[0] === 'cat') {
        setCurrentInput(`cat ${completions[0]}`)
      } else {
        setCurrentInput(completions[0])
      }
      setTabCompletions([])
      setTabIndex(-1)
    } else {
      // Multiple matches - start cycling
      setTabCompletions(completions)
      setTabIndex(0)

      // Set input to first completion
      if (parts.length > 1 && parts[0] === 'cat') {
        setCurrentInput(`cat ${completions[0]}`)
      } else {
        setCurrentInput(completions[0])
      }
    }
  }

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString()
  }

  const getInputHighlightClass = () => {
    if (!currentInput.trim()) return ''
    
    const [command] = currentInput.trim().split(' ')
    const availableCommands = Object.keys(commands)
    
    if (availableCommands.includes(command)) {
      return 'valid-command'
    } else if (availableCommands.some(cmd => cmd.startsWith(command))) {
      return 'partial-command'
    } else {
      return 'invalid-command'
    }
  }

  // Update system info periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // Memory Info (Chrome only)
      const memory = (performance as any).memory;
      if (memory) {
        setSystemInfo(prev => ({
          ...prev,
          memory: {
            used: memory.usedJSHeapSize / 1048576,
            total: memory.totalJSHeapSize / 1048576,
            percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
          }
        }));
      }

      // CPU Cores
      if (navigator.hardwareConcurrency) {
        setSystemInfo(prev => ({ ...prev, cores: navigator.hardwareConcurrency }));
      }

      // Network Info
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        setSystemInfo(prev => ({ ...prev, network: connection.effectiveType }));
      }

    }, 2000);

    // Battery Info
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBatteryStatus = () => {
          setSystemInfo(prev => ({
            ...prev,
            battery: {
              level: Math.round(battery.level * 100),
              charging: battery.charging
            }
          }));
        }
        updateBatteryStatus();
        battery.addEventListener('chargingchange', updateBatteryStatus);
        battery.addEventListener('levelchange', updateBatteryStatus);
      });
    }

    return () => {
      clearInterval(interval);
      // In a real app, you'd want to remove the battery event listeners here.
    };
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // ALT+TAB LOGIC
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        const switchableItems = [
          ...windows.filter(w => !w.isClosing),
          { id: 'terminal' }
        ];

        if (switchableItems.length <= 1) return;

        if (!isSwitching) {
          setIsSwitching(true);
          setSwitcherIndex(1);
        } else {
          setSwitcherIndex(prev => prev + 1);
        }
        return;
      }

      if (isSwitching) {
        e.preventDefault();
        return;
      }

      if (inputRef.current && e.target === inputRef.current) {
        return;
      }

      const openWindows = windows.filter(w => !w.isClosing);
      if (openWindows.length === 0) return;

      const topWindow = openWindows.reduce((prev, current) =>
        prev.z > current.z ? prev : current
      );

      if (e.key === 'Escape') {
        if (topWindow) {
          closeWindow(topWindow.id);
        }
        return;
      }

      if (e.ctrlKey && e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'k', 'j', 'h', 'l'].includes(e.key)) {
        e.preventDefault();
        if (topWindow) {
          const resizeAmount = 20;
          setWindows(prevWindows =>
            prevWindows.map(w => {
              if (w.id === topWindow.id) {
                const newSize = { width: w.width, height: w.height };
                switch (e.key) {
                  case 'ArrowUp':
                  case 'k':
                    newSize.height -= resizeAmount;
                    break;
                  case 'ArrowDown':
                  case 'j':
                    newSize.height += resizeAmount;
                    break;
                  case 'ArrowLeft':
                  case 'h':
                    newSize.width -= resizeAmount;
                    break;
                  case 'ArrowRight':
                  case 'l':
                    newSize.width += resizeAmount;
                    break;
                }
                newSize.width = Math.max(300, newSize.width);
                newSize.height = Math.max(200, newSize.height);
                return { ...w, ...newSize };
              }
              return w;
            })
          );
        }
        return;
      }

      if (e.ctrlKey && e.altKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'k', 'j', 'h', 'l'].includes(e.key)) {
        e.preventDefault();
        if (topWindow) {
          const moveAmount = 20;
          setWindows(prevWindows =>
            prevWindows.map(w => {
              if (w.id === topWindow.id) {
                const newPos = { x: w.x, y: w.y };
                switch (e.key) {
                  case 'ArrowUp':
                  case 'k':
                    newPos.y -= moveAmount;
                    break;
                  case 'ArrowDown':
                  case 'j':
                    newPos.y += moveAmount;
                    break;
                  case 'ArrowLeft':
                  case 'h':
                    newPos.x -= moveAmount;
                    break;
                  case 'ArrowRight':
                  case 'l':
                    newPos.x += moveAmount;
                    break;
                }
                return { ...w, ...newPos };
              }
              return w;
            })
          );
        }
        return;
      }

      if (e.altKey && (e.key === 'j' || e.key === 'k')) {
        e.preventDefault();
        const sortedWindows = [...openWindows].sort((a, b) => a.z - b.z);
        const topWindowIndex = sortedWindows.findIndex(w => w.id === topWindow.id);

        if (topWindowIndex !== -1) {
          let nextIndex;
          if (e.key === 'j') { // next window
            nextIndex = (topWindowIndex + 1) % sortedWindows.length;
          } else { // 'k', previous window
            nextIndex = (topWindowIndex - 1 + sortedWindows.length) % sortedWindows.length;
          }
          const nextWindowToFocus = sortedWindows[nextIndex];
          if (nextWindowToFocus) {
            focusWindow(nextWindowToFocus.id);
          }
        }
        return;
      }

      if (['j', 'k', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        if (topWindow) {
          const contentEl = document.getElementById(`window-content-${topWindow.id}`);
          if (contentEl) {
            const scrollAmount = 40;
            if (e.key === 'j' || e.key === 'ArrowDown') {
              contentEl.scrollTop += scrollAmount;
            } else if (e.key === 'k' || e.key === 'ArrowUp') {
              contentEl.scrollTop -= scrollAmount;
            }
          }
        }
      }
    };

    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        if (isSwitching) {
          setIsSwitching(false);
          const openWindows = windows.filter(w => !w.isClosing).sort((a, b) => b.z - a.z);
          const items = [
            ...openWindows.map(w => ({ id: w.id, title: w.title })),
            { id: 'terminal' as const, title: 'Terminal' }
          ];

          if (items.length > 0) {
            const finalIndex = switcherIndex % items.length;
            const selectedItem = items[finalIndex];
            if (selectedItem) {
              if (selectedItem.id === 'terminal') {
                inputRef.current?.focus();
              } else {
                focusWindow(selectedItem.id as number);
              }
            }
          }
          setSwitcherIndex(0);
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    document.addEventListener('keyup', handleGlobalKeyUp);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
      document.removeEventListener('keyup', handleGlobalKeyUp);
    };
  }, [windows, isSwitching, switcherIndex, focusWindow, closeWindow]);

  const openWindows = windows.filter(w => !w.isClosing);
  const topWindow = openWindows.length > 0
    ? openWindows.reduce((prev, current) => (prev.z > current.z ? prev : current))
    : null;

  return (
    <React.Fragment>
      <div className="terminal-app" onClick={handleTerminalClick}>
        <div className="terminal-header">
          <div className="terminal-buttons">
            <span className="btn close" onClick={() => window.close()}></span>
            <span className="btn minimize"></span>
            <span className="btn maximize"></span>
          </div>
          <div className="terminal-title">john@portfolio:~$ - Terminal</div>
          <div className="terminal-time">{getCurrentTime()}</div>
        </div>
        
        <div className="terminal-body" ref={terminalRef}>
          {terminalHistory.map((line, index) => (
            <div key={index} className={`terminal-line ${line.type}`}>
              {line.content}
            </div>
          ))}
          
          <div className="input-line">
            <span className="prompt">$ </span>
            <div className="input-container">
              <span className={`input-text ${getInputHighlightClass()}`}>{currentInput}</span>
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="terminal-input-hidden"
                spellCheck={false}
                autoComplete="off"
              />
              <span className={`cursor ${showCursor ? 'visible' : ''}`}>_</span>
            </div>
          </div>
          {tabCompletions.length > 0 && (
            <div className="completions">
              {tabCompletions.map((completion, index) => (
                <span
                  key={completion}
                  className={`completion-item ${index === tabIndex ? 'selected' : ''}`}
                >
                  {completion}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {windows.map(w => (
        <DraggableWindow
          key={w.id}
          id={w.id}
          title={w.title}
          content={w.content}
          x={w.x}
          y={w.y}
          z={w.z}
          width={w.width}
          height={w.height}
          isClosing={!!w.isClosing}
          onClose={closeWindow}
          onFocus={focusWindow}
          onMove={moveWindow}
          isFocused={topWindow ? w.id === topWindow.id : false}
        />
      ))}
      <WindowSwitcher
        isVisible={isSwitching}
        items={[
          ...windows.filter(w => !w.isClosing).sort((a, b) => b.z - a.z).map(w => ({ id: w.id, title: w.title })),
          { id: 'terminal', title: 'Terminal' }
        ]}
        selectedIndex={switcherIndex}
      />
      {windows.some(w => !w.isClosing) && <KeyInstructions />}
    </React.Fragment>
  )
}

export default App
