import config from '../config.json';

export interface TermolioConfig {
  site: {
    name: string;
    description: string;
    author: string;
    url: string;
  };
  theme: {
    syntax_highlighting: string;
    terminal_theme: string;
    font_family: string;
  };
  content: {
    articles_path: string;
    projects_path: string;
    max_recent_items: number;
  };
  terminal: {
    prompt_symbol: string;
    default_path: string;
    welcome_message: string;
  };
  navigation: {
    show_breadcrumbs: boolean;
    enable_autocomplete: boolean;
    history_limit: number;
  };
}

// Utility functions to get specific config values
export const getThemeConfig = () => config.theme;
export const getTerminalConfig = () => config.terminal;
export const getSiteConfig = () => config.site;
export const getContentConfig = () => config.content;
export const getNavigationConfig = () => config.navigation;
