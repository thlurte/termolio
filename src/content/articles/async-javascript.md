---
title: Understanding Async JavaScript
date: 2024-01-20
description: A comprehensive guide to asynchronous programming in JavaScript
tags: ["JavaScript", "Async", "Promises", "Programming"]
category: tutorial
difficulty: intermediate
---

# Understanding Async JavaScript

Asynchronous programming is fundamental to modern JavaScript development. Let's explore the evolution and best practices.

## The Evolution

### 1. Callbacks (The Old Days)
```javascript
function fetchData(callback) {
  setTimeout(() => {
    callback(null, { data: 'Hello World' });
  }, 1000);
}

fetchData((error, result) => {
  if (error) {
    console.error(error);
  } else {
    console.log(result.data);
  }
});
```

**Problems**: Callback hell, error handling complexity

### 2. Promises (The Improvement)
```javascript
function fetchData() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({ data: 'Hello World' });
    }, 1000);
  });
}

fetchData()
  .then(result => console.log(result.data))
  .catch(error => console.error(error));
```

### 3. Async/Await (The Modern Way)
```javascript
async function fetchData() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ data: 'Hello World' });
    }, 1000);
  });
}

async function main() {
  try {
    const result = await fetchData();
    console.log(result.data);
  } catch (error) {
    console.error(error);
  }
}
```

## Advanced Patterns

### Promise.all for Parallel Execution
```javascript
async function fetchMultipleData() {
  const promises = [
    fetch('/api/users'),
    fetch('/api/posts'),
    fetch('/api/comments')
  ];
  
  try {
    const [users, posts, comments] = await Promise.all(promises);
    return {
      users: await users.json(),
      posts: await posts.json(),
      comments: await comments.json()
    };
  } catch (error) {
    console.error('One or more requests failed:', error);
  }
}
```

### Promise.allSettled for Resilient Execution
```javascript
async function fetchWithFallbacks() {
  const promises = [
    fetch('/api/primary-data'),
    fetch('/api/fallback-data'),
    fetch('/api/cached-data')
  ];
  
  const results = await Promise.allSettled(promises);
  
  for (const result of results) {
    if (result.status === 'fulfilled') {
      return await result.value.json();
    }
  }
  
  throw new Error('All data sources failed');
}
```

## Error Handling Best Practices

### Global Error Handling
```javascript
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent the default behavior
  event.preventDefault();
});
```

### Custom Error Classes
```javascript
class APIError extends Error {
  constructor(message, status, endpoint) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

async function apiCall(endpoint) {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new APIError(
        `HTTP ${response.status}`,
        response.status,
        endpoint
      );
    }
    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      console.error(`API Error on ${error.endpoint}:`, error.message);
    } else {
      console.error('Network or parsing error:', error);
    }
    throw error;
  }
}
```

## Performance Considerations

### Avoiding Await in Loops
❌ **Don't do this:**
```javascript
async function processItems(items) {
  const results = [];
  for (const item of items) {
    const result = await processItem(item); // Sequential!
    results.push(result);
  }
  return results;
}
```

✅ **Do this instead:**
```javascript
async function processItems(items) {
  const promises = items.map(item => processItem(item));
  return Promise.all(promises); // Parallel!
}
```

## Testing Async Code

```javascript
// Using Jest
describe('Async functions', () => {
  test('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockData)
    });
    
    const result = await fetchUserData(1);
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith('/api/users/1');
  });
  
  test('should handle errors gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    
    await expect(fetchUserData(1)).rejects.toThrow('Network error');
  });
});
```

## Conclusion

Understanding asynchronous JavaScript is crucial for building responsive applications. The evolution from callbacks to async/await has made code more readable and maintainable, but it's important to understand the underlying concepts and patterns for effective error handling and performance optimization.
