---
title: React Hooks Deep Dive
date: 2024-02-10
description: Understanding advanced React hooks patterns
tags: ["React", "Hooks", "JavaScript", "Frontend"]
author: Developer
---

# React Hooks Deep Dive meow

React Hooks revolutionized how we write components in React. Let's explore some advanced patterns.

## useState with Complex State

```typescript
interface UserState {
  name: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

const [user, setUser] = useState<UserState>({
  name: '',
  email: '',
  preferences: {
    theme: 'light',
    notifications: true
  }
});
```

## useEffect Dependencies

The dependency array is crucial for performance:

```javascript
useEffect(() => {
  // This effect runs on every render
  console.log('Runs on every render');
});

useEffect(() => {
  // This effect runs only once
  console.log('Runs only on mount');
}, []);

useEffect(() => {
  // This effect runs when dependency changes
  console.log('Runs when count changes');
}, [count]);
```

## Custom Hooks

Creating reusable logic:

```typescript
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue] as const;
}
```

## Performance Optimization

### useMemo for Expensive Calculations

```typescript
const expensiveValue = useMemo(() => {
  return someExpensiveCalculation(data);
}, [data]);
```

### useCallback for Function References

```typescript
const memoizedCallback = useCallback(
  (id: string) => {
    doSomething(a, b, id);
  },
  [a, b]
);
```

## Conclusion

React Hooks provide powerful abstractions for state management and side effects. Understanding their nuances is key to writing efficient React applications.
