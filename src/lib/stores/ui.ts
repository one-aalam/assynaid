import { writable } from 'svelte/store';

// UI State store
export const uiState = writable({
  isLoading: false,
  isAnimatingOut: false,
  currentView: 'grid', // 'grid', 'list', or 'group'
  searchTerm: '',
  showAvatar: true,
  isCreatingGroup: false
});

// Theme store
export const theme = writable<'light' | 'dark'>('light');

// Load theme from storage
export const initTheme = () => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  chrome.storage.local.get(['theme'], (result) => {
    if (result.theme) {
      theme.set(result.theme);
    } else {
      theme.set(prefersDark ? 'dark' : 'light');
    }
  });
};

// Save theme to storage
theme.subscribe((value) => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ theme: value });
  }
  
  // Apply theme to document
  if (value === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
});

// Toggle theme
export const toggleTheme = () => {
  theme.update((t) => (t === 'light' ? 'dark' : 'light'));
};
