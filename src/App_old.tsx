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
      x: window.innerWidth / 2 - 350 + windows.length * 20,
      y: window.innerHeight / 2 - 200 + windows.length * 20,
      width: isMarkdown ? 900 : 700,
      height: isMarkdown ? 600 : 400,
      z: zIndexCounter,
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

  // Content data structure with markdown support
  const contentData = {
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

  const [directoryStack, setDirectoryStack] = useState(['~']);
    'ecommerce-platform': {
      title: 'E-Commerce Platform',
      description: 'Full-stack marketplace with 50k+ active users',
      tech: ['Next.js', 'Stripe API', 'PostgreSQL'],
      year: '2023',
      github: 'github.com/johndoe/ecommerce-platform',
      content: `# E-Commerce Platform

## Overview
A comprehensive full-stack e-commerce marketplace built to handle high traffic and complex transactions.

## Features
- **Real-time Inventory Management**: Live stock updates across multiple warehouses
- **Payment Processing**: Integrated Stripe API with support for multiple currencies
- **User Management**: Advanced authentication and authorization system
- **Admin Dashboard**: Complete order and inventory management interface

## Technical Implementation

### Backend Architecture
\`\`\`javascript
// Example API endpoint for order processing
app.post('/api/orders', async (req, res) => {
  const { items, customerId, paymentMethodId } = req.body;
  
  try {
    const order = await processOrder({
      items,
      customerId,
      paymentMethodId
    });
    
    res.json({ success: true, orderId: order.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
\`\`\`

### Database Schema
The platform uses PostgreSQL with optimized queries for high performance:

\`\`\`sql
-- Orders table with proper indexing
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  total_amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_status ON orders(customer_id, status);
\`\`\`

## Performance Metrics
- **Response Time**: Average API response < 200ms
- **Uptime**: 99.9% availability
- **Concurrent Users**: Handles 10k+ simultaneous users
- **Transaction Volume**: Processes $1M+ monthly

## Mathematical Optimization
The inventory allocation algorithm uses linear programming:

$$\\text{minimize} \\sum_{i=1}^{n} c_i x_i$$

Subject to:
$$\\sum_{i=1}^{n} a_{ij} x_i \\geq b_j \\text{ for all } j$$

Where $x_i$ represents inventory allocation and $c_i$ represents cost.

## Challenges & Solutions
1. **Scalability**: Implemented horizontal scaling with load balancers
2. **Security**: Added rate limiting and input validation
3. **Performance**: Optimized database queries and added Redis caching

## Future Enhancements
- Machine learning recommendation engine
- Real-time chat support
- Mobile app development
- International shipping integration`
    },
    'task-manager': {
      title: 'Task Management App',
      description: 'Collaborative project management tool with real-time sync',
      tech: ['React', 'Socket.io', 'MongoDB'],
      year: '2022',
      github: 'github.com/johndoe/task-manager',
      content: `# Task Management Application

## Project Overview
A collaborative task management application designed for remote teams with real-time synchronization capabilities.

## Core Features
- **Real-time Collaboration**: Live updates using WebSocket connections
- **Drag & Drop Interface**: Intuitive task organization
- **Custom Notifications**: Smart alert system
- **Team Management**: Role-based access control

## Technical Stack

### Frontend (React)
\`\`\`jsx
// Real-time task update component
const TaskBoard = () => {
  const [tasks, setTasks] = useState([]);
  
  useEffect(() => {
    socket.on('taskUpdated', (updatedTask) => {
      setTasks(prev => prev.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ));
    });
    
    return () => socket.off('taskUpdated');
  }, []);
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {/* Task board implementation */}
    </DragDropContext>
  );
};
\`\`\`

### Backend (Node.js + Socket.io)
\`\`\`javascript
// Real-time event handling
io.on('connection', (socket) => {
  socket.on('updateTask', async (taskData) => {
    try {
      const updatedTask = await Task.findByIdAndUpdate(
        taskData.id, 
        taskData, 
        { new: true }
      );
      
      // Broadcast to all connected clients
      io.emit('taskUpdated', updatedTask);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });
});
\`\`\`

## Database Design (MongoDB)
\`\`\`javascript
// Task schema
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: { 
    type: String, 
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo'
  },
  assignee: { type: ObjectId, ref: 'User' },
  project: { type: ObjectId, ref: 'Project' },
  priority: { type: Number, min: 1, max: 5 },
  dueDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
\`\`\`

## Performance Optimizations
- **Debounced Updates**: Prevents excessive API calls
- **Virtual Scrolling**: Handles large task lists efficiently
- **Optimistic Updates**: Immediate UI feedback

## Analytics & Metrics
The app tracks team productivity using velocity calculations:

$$\\text{Team Velocity} = \\frac{\\sum \\text{Story Points Completed}}{\\text{Sprint Duration}}$$

## Deployment
- **Frontend**: Deployed on Vercel with CDN
- **Backend**: Containerized with Docker on AWS ECS
- **Database**: MongoDB Atlas with automatic scaling
- **Monitoring**: Integrated with DataDog for performance tracking`
    },
    'weather-dashboard': {
      title: 'Weather Dashboard',
      description: 'Real-time weather data with beautiful visualizations',
      tech: ['Vue.js', 'Chart.js', 'OpenWeather API'],
      year: '2021',
      github: 'github.com/johndoe/weather-app',
      content: `# Weather Dashboard

## Project Description
A Progressive Web Application (PWA) that provides real-time weather data with interactive visualizations and offline capabilities.

## Key Features
- **Real-time Data**: Live weather updates from OpenWeather API
- **Interactive Charts**: Beautiful data visualizations using Chart.js
- **PWA Capabilities**: Offline functionality and push notifications
- **Responsive Design**: Works seamlessly across all devices

## Technical Implementation

### Vue.js Frontend
\`\`\`vue
<template>
  <div class="weather-dashboard">
    <WeatherCard 
      v-for="location in locations" 
      :key="location.id"
      :weather-data="location.weather"
      @refresh="refreshWeather(location.id)"
    />
    <WeatherChart :chart-data="chartData" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      locations: [],
      chartData: null
    }
  },
  async mounted() {
    await this.initializeWeatherData();
    this.startPeriodicUpdates();
  },
  methods: {
    async refreshWeather(locationId) {
      const weather = await this.fetchWeatherData(locationId);
      this.updateLocationWeather(locationId, weather);
    }
  }
}
</script>
\`\`\`

### API Integration
\`\`\`javascript
// Weather service with error handling and caching
class WeatherService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.cache = new Map();
    this.cacheTTL = 10 * 60 * 1000; // 10 minutes
  }
  
  async getWeatherData(lat, lon) {
    const cacheKey = \`\${lat},\${lon}\`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    
    try {
      const response = await fetch(
        \`https://api.openweathermap.org/data/2.5/weather?lat=\${lat}&lon=\${lon}&appid=\${this.apiKey}\`
      );
      
      if (!response.ok) throw new Error('Weather API request failed');
      
      const data = await response.json();
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('Weather fetch error:', error);
      return cached?.data || null;
    }
  }
}
\`\`\`

## Data Visualization
The dashboard uses Chart.js for interactive weather charts:

\`\`\`javascript
// Temperature trend chart configuration
const chartConfig = {
  type: 'line',
  data: {
    labels: timeLabels,
    datasets: [{
      label: 'Temperature (°C)',
      data: temperatureData,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.4
    }]
  },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: '24-Hour Temperature Trend'
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Temperature (°C)'
        }
      }
    }
  }
};
\`\`\`

## PWA Features
- **Service Worker**: Caches essential resources for offline use
- **App Manifest**: Enables installation on mobile devices
- **Push Notifications**: Weather alerts and updates

## Weather Calculations
The app includes advanced weather calculations:

### Heat Index Formula
$$HI = c_1 + c_2T + c_3R + c_4TR + c_5T^2 + c_6R^2 + c_7T^2R + c_8TR^2 + c_9T^2R^2$$

Where:
- $T$ = Temperature in °F
- $R$ = Relative humidity percentage
- $c_1$ through $c_9$ are empirical constants

### Wind Chill Calculation
$$WC = 35.74 + 0.6215T - 35.75V^{0.16} + 0.4275TV^{0.16}$$

Where:
- $T$ = Air temperature in °F
- $V$ = Wind speed in mph

## Performance Metrics
- **Initial Load**: < 2 seconds on 3G networks
- **Cache Hit Rate**: 85% for repeat visits
- **Offline Functionality**: 100% core features available
- **Lighthouse Score**: 95+ across all categories`
    }
  };

  // Articles with markdown content
  const articles = {
    'react-performance': {
      title: 'React Performance Optimization',
      description: 'Deep dive into React performance best practices',
      date: '2024-01-15',
      tags: ['React', 'Performance', 'JavaScript'],
      readTime: '8 min read',
      content: `# React Performance Optimization: A Deep Dive

## Introduction
Performance optimization in React applications is crucial for delivering excellent user experiences. This article explores advanced techniques and best practices.

## Key Performance Concepts

### 1. Virtual DOM Optimization
React's Virtual DOM is powerful, but understanding its limitations is key:

\`\`\`jsx
// ❌ Bad: Creates new object on every render
const MyComponent = () => {
  return (
    <div style={{ margin: '10px' }}>
      Content
    </div>
  );
};

// ✅ Good: Define styles outside component
const styles = { margin: '10px' };
const MyComponent = () => {
  return (
    <div style={styles}>
      Content
    </div>
  );
};
\`\`\`

### 2. Memoization Strategies

#### React.memo for Component Memoization
\`\`\`jsx
const ExpensiveComponent = React.memo(({ data, onUpdate }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: heavyCalculation(item)
    }));
  }, [data]);

  return (
    <div>
      {processedData.map(item => (
        <Item key={item.id} data={item} onUpdate={onUpdate} />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.data.length === nextProps.data.length &&
         prevProps.data.every((item, index) => 
           item.id === nextProps.data[index].id
         );
});
\`\`\`

#### useMemo and useCallback
\`\`\`jsx
const DataProcessor = ({ items, filters }) => {
  // Memoize expensive calculations
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      filters.every(filter => filter.predicate(item))
    );
  }, [items, filters]);

  // Memoize event handlers
  const handleItemUpdate = useCallback((id, updates) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  return (
    <VirtualizedList 
      items={filteredItems}
      onItemUpdate={handleItemUpdate}
    />
  );
};
\`\`\`

## Advanced Optimization Techniques

### Bundle Splitting and Code Splitting
\`\`\`jsx
// Dynamic imports for route-based code splitting
const Dashboard = lazy(() => import('./Dashboard'));
const Profile = lazy(() => import('./Profile'));

const App = () => (
  <Router>
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  </Router>
);
\`\`\`

### Performance Measurement
\`\`\`jsx
// Using React Profiler API
const ProfiledComponent = ({ children }) => {
  const onRenderCallback = (id, phase, actualDuration) => {
    console.log('Component rendered:', {
      id,
      phase,
      actualDuration
    });
  };

  return (
    <Profiler id="MyApp" onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
};
\`\`\`

## State Management Optimization

### Context Splitting
\`\`\`jsx
// Split contexts to prevent unnecessary re-renders
const UserContext = createContext();
const ThemeContext = createContext();

// Instead of one large context
const AppContext = createContext(); // ❌
\`\`\`

### State Structure Optimization
\`\`\`jsx
// ❌ Avoid nested state updates
const [state, setState] = useState({
  user: { profile: { settings: {} } }
});

// ✅ Flatten state structure
const [user, setUser] = useState(null);
const [profile, setProfile] = useState(null);
const [settings, setSettings] = useState({});
\`\`\`

## Performance Budget Analysis

The mathematical model for React performance can be expressed as:

$$\\text{Render Time} = \\sum_{i=1}^{n} (C_i + R_i + D_i)$$

Where:
- $C_i$ = Component calculation time
- $R_i$ = Reconciliation time  
- $D_i$ = DOM update time

## Monitoring and Metrics

### Core Web Vitals for React Apps
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Custom Performance Hooks
\`\`\`jsx
const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      setMetrics(prev => ({
        ...prev,
        ...processPerformanceEntries(entries)
      }));
    });

    observer.observe({ entryTypes: ['measure', 'navigation'] });
    return () => observer.disconnect();
  }, []);

  return metrics;
};
\`\`\`

## Conclusion
React performance optimization requires a holistic approach combining proper architecture, efficient state management, and continuous monitoring. The key is to measure, optimize, and validate improvements systematically.

## Further Reading
- [React Profiler Documentation](https://reactjs.org/docs/profiler.html)
- [Web.dev Performance Guide](https://web.dev/performance/)
- [Chrome DevTools Performance Tab](https://developers.google.com/web/tools/chrome-devtools/evaluate-performance)`
    },
    'machine-learning-web': {
      title: 'Machine Learning in Web Applications',
      description: 'Integrating ML models into modern web apps',
      date: '2024-02-20',
      tags: ['Machine Learning', 'TensorFlow.js', 'AI'],
      readTime: '12 min read',
      content: `# Machine Learning in Web Applications

## The Rise of Client-Side ML
Machine learning is no longer confined to server environments. With libraries like TensorFlow.js and WebAssembly, we can now run sophisticated ML models directly in the browser.

## TensorFlow.js Implementation

### Loading Pre-trained Models
\`\`\`javascript
// Loading a pre-trained image classification model
import * as tf from '@tensorflow/tfjs';

class ImageClassifier {
  constructor() {
    this.model = null;
    this.labels = [];
  }

  async loadModel() {
    try {
      // Load MobileNet model
      this.model = await tf.loadLayersModel('/models/mobilenet/model.json');
      
      // Load class labels
      const response = await fetch('/models/mobilenet/labels.json');
      this.labels = await response.json();
      
      console.log('Model loaded successfully');
    } catch (error) {
      console.error('Failed to load model:', error);
    }
  }

  async classifyImage(imageElement) {
    if (!this.model) {
      await this.loadModel();
    }

    // Preprocess image
    const tensor = tf.browser.fromPixels(imageElement)
      .resizeNearestNeighbor([224, 224])
      .expandDims(0)
      .div(255.0);

    // Make prediction
    const predictions = await this.model.predict(tensor).data();
    
    // Get top 5 predictions
    const topPredictions = this.getTopPredictions(predictions, 5);
    
    // Clean up tensor
    tensor.dispose();
    
    return topPredictions;
  }

  getTopPredictions(predictions, topK) {
    const indexed = Array.from(predictions)
      .map((probability, index) => ({ probability, index }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, topK);

    return indexed.map(item => ({
      label: this.labels[item.index],
      probability: item.probability
    }));
  }
}
\`\`\`

### Real-time Object Detection
\`\`\`javascript
// Real-time object detection using COCO-SSD
import '@tensorflow/tfjs-backend-webgl';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

class ObjectDetector {
  constructor() {
    this.model = null;
    this.isDetecting = false;
  }

  async initialize() {
    this.model = await cocoSsd.load();
    console.log('Object detection model loaded');
  }

  async detectObjects(videoElement) {
    if (!this.model || this.isDetecting) return;
    
    this.isDetecting = true;
    
    try {
      const predictions = await this.model.detect(videoElement);
      this.drawBoundingBoxes(videoElement, predictions);
    } catch (error) {
      console.error('Detection error:', error);
    } finally {
      this.isDetecting = false;
    }
  }

  drawBoundingBoxes(videoElement, predictions) {
    const canvas = document.getElementById('detection-canvas');
    const ctx = canvas.getContext('2d');
    
    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    predictions.forEach(prediction => {
      const [x, y, width, height] = prediction.bbox;
      
      // Draw bounding box
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      
      // Draw label
      ctx.fillStyle = '#00ff00';
      ctx.font = '16px Arial';
      ctx.fillText(
        \`\${prediction.class} (\${Math.round(prediction.score * 100)}%)\`,
        x, y - 10
      );
    });
  }

  startRealTimeDetection(videoElement) {
    const detectFrame = () => {
      this.detectObjects(videoElement);
      requestAnimationFrame(detectFrame);
    };
    
    detectFrame();
  }
}
\`\`\`

## Custom Model Training

### Data Preparation
\`\`\`javascript
// Preparing training data for a simple neural network
class DataPreprocessor {
  constructor() {
    this.normalizers = {};
  }

  normalizeFeatures(data, features) {
    const normalized = { ...data };
    
    features.forEach(feature => {
      const values = data[feature];
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      this.normalizers[feature] = { min, max };
      
      normalized[feature] = values.map(value => 
        (value - min) / (max - min)
      );
    });

    return normalized;
  }

  createTensors(data) {
    const features = tf.tensor2d(data.features);
    const labels = tf.tensor2d(data.labels);
    
    return { features, labels };
  }
}
\`\`\`

### Model Architecture
\`\`\`javascript
// Building a neural network for classification
class CustomMLModel {
  constructor(inputShape, numClasses) {
    this.model = this.buildModel(inputShape, numClasses);
  }

  buildModel(inputShape, numClasses) {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [inputShape],
          units: 128,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: numClasses,
          activation: 'softmax'
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  async train(trainData, validationData, epochs = 100) {
    const history = await this.model.fit(
      trainData.features,
      trainData.labels,
      {
        epochs,
        validationData: [validationData.features, validationData.labels],
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(\`Epoch \${epoch + 1}: loss = \${logs.loss.toFixed(4)}, accuracy = \${logs.acc.toFixed(4)}\`);
          }
        }
      }
    );

    return history;
  }

  async predict(inputData) {
    const prediction = this.model.predict(inputData);
    return prediction;
  }

  async saveModel(path) {
    await this.model.save(\`localstorage://\${path}\`);
  }

  async loadModel(path) {
    this.model = await tf.loadLayersModel(\`localstorage://\${path}\`);
  }
}
\`\`\`

## Mathematical Foundations

### Neural Network Forward Pass
The forward pass through a neural network can be expressed as:

$$y = f(W_n \cdot f(W_{n-1} \cdot ... \cdot f(W_1 \cdot x + b_1) + b_{n-1}) + b_n)$$

Where:
- $W_i$ = Weight matrix for layer $i$
- $b_i$ = Bias vector for layer $i$  
- $f$ = Activation function
- $x$ = Input vector
- $y$ = Output vector

### Backpropagation Algorithm
The gradient calculation for weight updates:

$$\\frac{\\partial L}{\\partial W_i} = \\frac{\\partial L}{\\partial y} \\cdot \\frac{\\partial y}{\\partial W_i}$$

Where $L$ is the loss function.

## Performance Optimization

### Model Quantization
\`\`\`javascript
// Quantizing model for better performance
async function quantizeModel(model) {
  const quantizedModel = await tf.quantization.quantize(model, {
    quantizationBytes: 1, // 8-bit quantization
    quantizeWeights: true,
    quantizeBias: false
  });
  
  return quantizedModel;
}
\`\`\`

### WebAssembly Integration
\`\`\`javascript
// Using WebAssembly for computationally intensive operations
class WasmMLProcessor {
  constructor() {
    this.wasmModule = null;
  }

  async initialize() {
    const wasmPath = '/wasm/ml-processor.wasm';
    this.wasmModule = await WebAssembly.instantiateStreaming(
      fetch(wasmPath)
    );
  }

  processData(inputArray) {
    if (!this.wasmModule) {
      throw new Error('WASM module not initialized');
    }

    const result = this.wasmModule.instance.exports.processMLData(
      inputArray.ptr,
      inputArray.length
    );

    return result;
  }
}
\`\`\`

## Real-world Applications

### Recommendation System
\`\`\`javascript
// Collaborative filtering recommendation system
class RecommendationEngine {
  constructor() {
    this.userItemMatrix = null;
    this.model = null;
  }

  async trainModel(userItemData) {
    // Build user-item interaction matrix
    this.userItemMatrix = this.buildMatrix(userItemData);
    
    // Train matrix factorization model
    this.model = await this.trainMatrixFactorization();
  }

  async getRecommendations(userId, numRecommendations = 10) {
    const userVector = this.getUserVector(userId);
    const predictions = await this.model.predict(userVector);
    
    return this.getTopItems(predictions, numRecommendations);
  }

  buildMatrix(data) {
    // Implementation for building sparse user-item matrix
    const matrix = tf.sparse.sparseTensor(
      data.indices,
      data.values,
      data.shape
    );
    
    return matrix;
  }
}
\`\`\`

## Browser Compatibility and Fallbacks

### Progressive Enhancement
\`\`\`javascript
// Feature detection and fallbacks
class MLFeatureDetector {
  static supportsWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  static supportsWebAssembly() {
    return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
  }

  static getOptimalBackend() {
    if (this.supportsWebGL()) {
      return 'webgl';
    } else if (this.supportsWebAssembly()) {
      return 'wasm';
    } else {
      return 'cpu';
    }
  }
}

// Initialize TensorFlow.js with optimal backend
await tf.setBackend(MLFeatureDetector.getOptimalBackend());
\`\`\`

## Conclusion
Machine learning in web applications opens up exciting possibilities for creating intelligent, responsive user experiences. The key is to balance model complexity with performance requirements while ensuring graceful degradation for less capable devices.

## Resources
- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
- [ML5.js - Friendly Machine Learning](https://ml5js.org/)
- [WebAssembly and Machine Learning](https://webassembly.org/)`
    }
  };

  const [directoryStack, setDirectoryStack] = useState(['~']);

  const bioData = contentData;

  const commands = {
    help: () => [
      'Available commands:',
      '',
      '  about      - Show personal information',
      '  projects   - List my projects',
      '  articles   - List my articles',
      '  contact    - Show contact information',
      '  sysinfo    - Show system information',
      '  cd <dir>   - Change directory (projects/, articles/, ~)',
      '  ls         - List directory contents',
      '  pwd        - Show current directory',
      '  cat <file> - Display content of a file',
      '  clear      - Clear terminal screen',
      '  whoami     - Show current user',
      '  date       - Show current date and time',
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
    projects: () => {
      const projectsList = Object.entries(projects).map(([_, project]) => 
        `  ${project.title} (${project.year}) - ${project.description}`
      );
      openWindow('projects.txt', [
        '╭─────────────────────────────────────────────────────────────────╮',
        '│                            PROJECTS                             │',
        '├─────────────────────────────────────────────────────────────────┤',
        '│                                                                 │',
        ...projectsList.map(line => `│${line.padEnd(65)}│`),
        '│                                                                 │',
        '╰─────────────────────────────────────────────────────────────────╯'
      ]);
      return [];
    },
    articles: () => {
      const articlesList = Object.entries(articles).map(([_, article]) => 
        `  ${article.title} (${article.date}) - ${article.description}`
      );
      openWindow('articles.txt', [
        '╭─────────────────────────────────────────────────────────────────╮',
        '│                            ARTICLES                             │',
        '├─────────────────────────────────────────────────────────────────┤',
        '│                                                                 │',
        ...articlesList.map(line => `│${line.padEnd(65)}│`),
        '│                                                                 │',
        '╰─────────────────────────────────────────────────────────────────╯'
      ]);
      return [];
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
      if (currentDirectory === '~/projects' && fileName in projects) {
        const project = projects[fileName as keyof typeof projects];
        openWindow(project.title, [], true, project.content);
        return;
      }
      
      // Handle articles
      if (currentDirectory === '~/articles' && fileName in articles) {
        const article = articles[fileName as keyof typeof articles];
        openWindow(article.title, [], true, article.content);
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
    } else if (parts.length === 2) {
      if (parts[0] === 'cat') {
        // File completion for cat command
        return getCurrentDirectoryContents().filter(file => file.startsWith(parts[1]))
      } else if (parts[0] === 'cd') {
        // Directory completion for cd command
        const dirs = ['~', '..', 'projects/', 'articles/'];
        return dirs.filter(dir => dir.startsWith(parts[1]))
      }
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
      
      if (parts.length > 1 && (parts[0] === 'cat' || parts[0] === 'cd')) {
        setCurrentInput(`${parts[0]} ${completion}`)
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
      if (parts.length > 1 && (parts[0] === 'cat' || parts[0] === 'cd')) {
        setCurrentInput(`${parts[0]} ${completions[0]}`)
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
      if (parts.length > 1 && (parts[0] === 'cat' || parts[0] === 'cd')) {
        setCurrentInput(`${parts[0]} ${completions[0]}`)
      } else {
        setCurrentInput(completions[0])
      }
    }
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
      <ASCIIClock />
      <MatrixRain />
      <div className="terminal-app" onClick={handleTerminalClick}>
        <div className="terminal-header">
          <div className="terminal-buttons">
            <span className="btn close" onClick={() => window.close()}></span>
            <span className="btn minimize"></span>
            <span className="btn maximize"></span>
          </div>
          <div className="terminal-title">john@portfolio:~$ - Terminal</div>
        </div>
        
        <div className="terminal-body" ref={terminalRef}>
          {terminalHistory.map((line, index) => (
            <div key={index} className={`terminal-line ${line.type}`}>
              {line.content}
            </div>
          ))}
          
          <div className="input-line">
            <span className="prompt">{currentDirectory}$ </span>
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
          isMarkdown={w.isMarkdown}
          markdownContent={w.markdownContent}
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
