// Content loader utility for dynamically importing markdown files
// This file handles the loading and parsing of markdown content

export interface ContentMeta {
  title: string;
  date: string;
  description: string;
  tags: string[];
  author?: string;
  category?: string;
  difficulty?: string;
}

export interface ContentItem {
  id: string;
  meta: ContentMeta;
  content: string;
}

export interface ContentCollection {
  [key: string]: ContentItem;
}

// Parse frontmatter from markdown content
export function parseFrontmatter(content: string): { meta: ContentMeta; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return {
      meta: {
        title: 'Untitled',
        date: new Date().toISOString().split('T')[0],
        description: '',
        tags: []
      },
      content
    };
  }
  
  const [, frontmatterStr, markdownContent] = match;
  const meta: Partial<ContentMeta> = {};
  
  // Parse YAML-like frontmatter
  const lines = frontmatterStr.split('\n');
  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim();
      
      if (key.trim() === 'tags') {
        // Parse array format: ["tag1", "tag2", "tag3"]
        try {
          meta.tags = JSON.parse(value);
        } catch {
          meta.tags = [value.replace(/"/g, '')];
        }
      } else {
        meta[key.trim() as keyof ContentMeta] = value.replace(/^["']|["']$/g, '') as any;
      }
    }
  }
  
  return {
    meta: meta as ContentMeta,
    content: markdownContent.trim()
  };
}

// Import markdown files directly as a fallback
import terminalPortfolioMd from '../content/projects/terminal-portfolio.md?raw';
import reactDashboardMd from '../content/projects/react-dashboard.md?raw';
import webTrends2024Md from '../content/articles/web-trends-2024.md?raw';
import asyncJavaScriptMd from '../content/articles/async-javascript.md?raw';
import aboutMd from '../content/about.md?raw';
import contactMd from '../content/contact.md?raw';

// A map of simplified paths to their raw markdown content imports
const contentModules = {
  'about.md': aboutMd,
  'contact.md': contactMd,
  'projects/terminal-portfolio.md': terminalPortfolioMd,
  'projects/react-dashboard.md': reactDashboardMd,
  'articles/web-trends-2024.md': webTrends2024Md,
  'articles/async-javascript.md': asyncJavaScriptMd,
};

// Export available files for external use
export const availableFiles = Object.keys(contentModules);

// Load a single content file by a simplified path
export async function loadContentFile(path: string): Promise<ContentItem | null> {
  try {
    // @ts-ignore
    const content = contentModules[path];

    if (!content) {
      return null;
    }

    const { meta, content: markdownContent } = parseFrontmatter(content);

    return {
      id: path,
      meta,
      content: markdownContent,
    };
  } catch (error) {
    console.error(`Error loading content for path: ${path}`, error);
    return null;
  }
}

// Load a collection of content items (e.g., all projects or articles)
export async function loadContentCollection(type: 'projects' | 'articles'): Promise<ContentItem[]> {
  const collection: ContentItem[] = [];
  const paths = Object.keys(contentModules).filter(path => path.startsWith(type + '/'));

  for (const path of paths) {
    const item = await loadContentFile(path);
    if (item) {
      collection.push(item);
    }
  }

  return collection;
}

// Initialize content for the terminal app
export async function initializeContent() {
  const [projects, articles, about, contact] = await Promise.all([
    loadContentCollection('projects'),
    loadContentCollection('articles'),
    loadContentFile('/src/content/about.md'),
    loadContentFile('/src/content/contact.md')
  ]);
  
  return { projects, articles, about, contact };
}

// Fallback content if dynamic loading fails
export const fallbackContent: {
  projects: ContentCollection;
  articles: ContentCollection;
  about?: ContentItem;
  contact?: ContentItem;
} = {
  projects: {
    'example-project': {
      id: 'example-project',
      meta: {
        title: 'Example Project',
        date: '2024-01-01',
        description: 'A sample project to demonstrate the system',
        tags: ['demo', 'example']
      },
      content: `# Example Project\n\nThis is a fallback project that demonstrates the markdown rendering system.\n\n## Features\n- Markdown support\n- LaTeX equations\n- Code highlighting\n\n\`\`\`javascript\nconsole.log('Hello, World!');\n\`\`\``
    }
  },
  articles: {
    'example-article': {
      id: 'example-article',
      meta: {
        title: 'Example Article',
        date: '2024-01-01',
        description: 'A sample article to demonstrate the system',
        tags: ['demo', 'example']
      },
      content: `# Example Article\n\nThis is a fallback article that demonstrates the markdown rendering system.\n\n## Content\nThis article shows how the system works when dynamic loading is not available.`
    }
  },
  about: {
    id: 'about',
    meta: {
      title: 'About Me',
      date: '2024-07-02',
      description: 'Learn more about my background',
      tags: ['personal']
    },
    content: `# About Me\n\nFallback about content.`
  },
  contact: {
    id: 'contact',
    meta: {
      title: 'Contact',
      date: '2024-07-02',
      description: 'Get in touch',
      tags: ['contact']
    },
    content: `# Contact\n\nFallback contact content.`
  }
};
