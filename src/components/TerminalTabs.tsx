import React from 'react';
import type { Tab } from '../types';

interface TerminalTabsProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
}

const TerminalTabs: React.FC<TerminalTabsProps> = ({ tabs, activeTabId, onTabClick, onCloseTab }) => {
  return (
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
  );
};

export default TerminalTabs;
