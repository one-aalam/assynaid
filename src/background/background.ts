/**
 * Background script for the Assynaid Chrome extension
 * Handles extension installation, updates, and other background processes
 */

// Handle extension installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Assynaid extension installed or updated:', details.reason);

  // Set up initial state on installation
  if (details.reason === 'install') {
    chrome.storage.local.set({
      assigneeState: {
        assignees: [],
        selectedAssigneeIds: [],
        groups: [],
        currentGroupId: null,
        lastScanTime: null
      },
      theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    });

    // Show the installation page
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome/welcome.html')
    });
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateBadge') {
    const count = request.count || 0;

    if (count > 0) {
      chrome.action.setBadgeText({ text: count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#0052CC' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }

    sendResponse({ success: true });
  }

  return true; // Keep the message channel open for async response
});

// Update badge when storage changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.assigneeState && changes.assigneeState.newValue) {
    const assignees = changes.assigneeState.newValue.assignees || [];

    if (assignees.length > 0) {
      chrome.action.setBadgeText({ text: assignees.length.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#0052CC' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }
});

// Log background script initialization
console.log('Assynaid background script initialized');
