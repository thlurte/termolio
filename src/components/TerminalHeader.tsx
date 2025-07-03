import React from 'react';

interface TerminalHeaderProps {
  siteName: string;
  activeTabTitle: string;
  currentTime: string;
}

const TerminalHeader: React.FC<TerminalHeaderProps> = ({ siteName, activeTabTitle, currentTime }) => {
  return (
    <div className="terminal-header">
      <div className="terminal-buttons">
        <span className="btn close"></span>
        <span className="btn minimize"></span>
        <span className="btn maximize"></span>
      </div>
      <span className="terminal-title">{siteName.toLowerCase()} - {activeTabTitle}</span>
      <span className="terminal-time">{currentTime}</span>
    </div>
  );
};

export default TerminalHeader;
