import React from 'react';
import type { Tab } from '../types';

interface TerminalHeaderProps {
  siteName: string;
  activeTabTitle: string;
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
}

const TerminalHeader: React.FC<TerminalHeaderProps> = ({ 
  siteName, 
  activeTabTitle, 
  tabs, 
  activeTabId, 
  onTabClick, 
  onCloseTab 
}) => {
  return (
    <div className="terminal-header">
      <div className="terminal-buttons">
        <span className="btn close"></span>
        <span className="btn minimize"></span>
        <span className="btn maximize"></span>
      </div>
      <span className="terminal-title">{siteName.toLowerCase()} - {activeTabTitle}</span>
      <div className="terminal-tabs">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`terminal-tab ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => onTabClick(tab.id)}
          >
            {tab.title}
            {tab.type !== 'shell' && (
              <button onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }} className="close-tab-btn">x</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerminalHeader;
