export interface Tab {
  id: string;
  title: string;
  content: string;
  type: 'shell' | 'content';
}

export interface HistoryEntry {
  type: 'input' | 'output' | 'error';
  content: string;
  path?: string;
}
