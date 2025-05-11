import type { Assignee } from '$lib/models/assignee';

// Store a reference to assignee DOM elements for selection
const assigneeElementMap = new Map<string, HTMLElement>();

/**
 * Listen for messages from the popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scanAssignees') {
    scanJiraAssignees().then(assignees => {
      sendResponse({ assignees });
    });
    return true; // Keep the message channel open for async response
  } else if (request.action === 'applyAssigneeSelection') {
    applyAssigneeSelection(request.selectedAssigneeIds);
    sendResponse({ success: true });
    return true;
  }
});

/**
 * Scan the page for Jira assignees
 */
async function scanJiraAssignees(): Promise<Assignee[]> {
  // Clear the previous element map
  assigneeElementMap.clear();
  
  const assignees: Assignee[] = [];
  let idCounter = 1;

  try {
    // First, try to scan the visible avatars section
    let visibleAssignees = await scanVisibleAssignees();
    assignees.push(...visibleAssignees);
    
    // Check if we need to open the dropdown to get more assignees
    const needToOpenDropdown = await checkForHiddenDropdown();
    
    if (needToOpenDropdown) {
      // Open the dropdown
      const dropdownOpened = await openAssigneeDropdown();
      
      if (dropdownOpened) {
        // Give some time for the dropdown to render
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Scan the dropdown
        const dropdownAssignees = await scanDropdownAssignees();
        
        // Filter out duplicates (by name)
        const existingNames = new Set(assignees.map(a => a.name));
        const newAssignees = dropdownAssignees.filter(a => !existingNames.has(a.name));
        
        assignees.push(...newAssignees);
        
        // Close the dropdown to restore original state
        await closeAssigneeDropdown();
      }
    }
    
    // As a fallback, scan for any other avatar images
    const backupAssignees = await scanBackupAssignees(idCounter);
    
    // Add unique backup assignees
    const existingNames = new Set(assignees.map(a => a.name));
    const uniqueBackupAssignees = backupAssignees.filter(a => !existingNames.has(a.name));
    
    assignees.push(...uniqueBackupAssignees);
    
    return assignees;
  } catch (error) {
    console.error('Error scanning Jira assignees:', error);
    return [];
  }
}

/**
 * Check if there's a hidden dropdown that needs to be opened
 */
async function checkForHiddenDropdown(): Promise<boolean> {
  // Look for the "show more" button
  const showMoreButton = document.querySelector('[data-testid="filters.ui.filters.assignee.stateless.show-more-button.assignee-filter-show-more"]');
  
  // Look for the dropdown element
  const dropdown = document.querySelector('[id^="ds--dropdown--"]');
  
  // If the button exists and the dropdown is not visible
  return !!(showMoreButton && (!dropdown || !isElementVisible(dropdown as HTMLElement)));
}

/**
 * Helper function to check if an element is visible
 */
function isElementVisible(element: HTMLElement): boolean {
  return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
}

/**
 * Open the assignee dropdown
 */
async function openAssigneeDropdown(): Promise<boolean> {
  const showMoreButton = document.querySelector('[data-testid="filters.ui.filters.assignee.stateless.show-more-button.assignee-filter-show-more"]');
  
  if (showMoreButton) {
    (showMoreButton as HTMLElement).click();
    return true;
  }
  
  // Alternative approach - find and click the assignee filter button
  const assigneeFilterButtons = Array.from(document.querySelectorAll('button, [role="button"]')).filter(btn => {
    const text = (btn.textContent || '').toLowerCase();
    return text.includes('assignee') && (text.includes('filter') || text.includes('any'));
  });
  
  if (assigneeFilterButtons.length > 0) {
    (assigneeFilterButtons[0] as HTMLElement).click();
    return true;
  }
  
  return false;
}

/**
 * Close the assignee dropdown
 */
async function closeAssigneeDropdown(): Promise<void> {
  // Try different approaches
  
  // 1. Click outside the dropdown (create a temporary overlay and click it)
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.zIndex = '9999';
  overlay.style.background = 'transparent';
  
  document.body.appendChild(overlay);
  overlay.click();
  document.body.removeChild(overlay);
  
  // 2. Press Escape key
  document.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Escape',
    code: 'Escape',
    keyCode: 27,
    which: 27,
    bubbles: true
  }));
  
  // 3. Look for a close button and click it
  const closeButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
    return btn.getAttribute('aria-label')?.toLowerCase().includes('close') || 
           btn.textContent?.toLowerCase() === 'close' ||
           btn.textContent?.toLowerCase() === 'cancel';
  });
  
  if (closeButtons.length > 0) {
    (closeButtons[0] as HTMLElement).click();
  }
}

/**
 * Scan for visible assignees in the filter section
 */
async function scanVisibleAssignees(): Promise<Assignee[]> {
  const assignees: Assignee[] = [];
  let idCounter = 1;
  
  // Scan for assignees in the visible avatars section
  const checkboxElements = document.querySelectorAll('input[name="assignee"]');
    
  checkboxElements.forEach(checkboxElement => {
    try {
      const element = checkboxElement.parentElement;
      const imgElement = element?.querySelector('img');
      if (imgElement) {
        const avatarUrl = imgElement.src;
        const nameElement = element?.querySelector('[id^=":"]');
        let name = nameElement ? nameElement.textContent : 'Unknown';
        
        // Clean up the name
        name = name.trim();
        
        // Find the checkbox element for selection later
        // const checkboxElement = element as HTMLInputElement;
        const assigneeId = checkboxElement ? checkboxElement.value : `assignee_${idCounter++}`;
        
        if (name && avatarUrl && !['bug', 'story'].includes(name.toLowerCase())) {
          assignees.push({
            id: assigneeId,
            name,
            avatarUrl
          });
          
          // Store the element reference
          assigneeElementMap.set(assigneeId, element as HTMLElement);
        }
      }
    } catch (e) {
      console.error('Error processing avatar element:', e);
    }
  });
  
  return assignees;
}

/**
 * Scan for assignees in the dropdown list
 */
async function scanDropdownAssignees(): Promise<Assignee[]> {
  const assignees: Assignee[] = [];
  let idCounter = 1;
  
  // Look for the dropdown
  const dropdown = document.querySelector('.css-1u0qf12')?.parentElement; // document.querySelector('[id^="ds--dropdown--"]'); 
  
  if (!dropdown) {
    // Try alternative selectors
    const alternativeDropdowns = [
      document.querySelector('[role="menu"]'),
      document.querySelector('[role="listbox"]'),
      document.querySelector('[class*="dropdown"]'),
      document.querySelector('.dropdown'),
      document.querySelector('.popup')
    ];
    
    for (const alt of alternativeDropdowns) {
      if (alt) {
        scanDropdownElement(alt as HTMLElement, assignees, idCounter);
        break;
      }
    }
  } else {
    scanDropdownElement(dropdown as HTMLElement, assignees, idCounter);
  }
  
  return assignees;
}

/**
 * Scan a dropdown element for assignees
 */
function scanDropdownElement(dropdownElement: HTMLElement, assignees: Assignee[], idCounter: number): void {
  // Look for menuitemcheckbox elements in the dropdown
  const menuItemElements = dropdownElement.querySelectorAll('button[role="menuitemcheckbox"]');
  
  menuItemElements.forEach(element => {
    try {
      // Find the name element
      const nameDiv = element.querySelector('div[class$="_o5721q9c"]');
      
      if (!nameDiv) {
        // Try alternative ways to get the name
        const possibleNameElements = [
          element.querySelector('div:not([class*="avatar"]):not([class*="img"]) > div'),
          element.querySelector('[class*="name"], [class*="title"]'),
          element.querySelector('div > div:last-child'),
          element
        ];
        
        let name = null;
        for (const elem of possibleNameElements) {
          if (elem && elem.textContent && elem.textContent.trim()) {
            name = elem.textContent.trim();
            break;
          }
        }
        
        if (!name) return;
        
        // Find the avatar image
        const imgElement = element.querySelector('img');
        const avatarUrl = imgElement ? imgElement.src : '';
        
        // Get the button ID as assignee ID
        const assigneeId = (element as HTMLElement).id || `dropdown_assignee_${idCounter++}`;
        
        if (name && avatarUrl) {
          assignees.push({
            id: assigneeId,
            name,
            avatarUrl
          });
          
          // Store the element reference
          assigneeElementMap.set(assigneeId, element as HTMLElement);
        }
      } else {
        const name = nameDiv.textContent?.trim() || 'Unknown';
        
        // Find the avatar image
        const imgElement = element.querySelector('img[data-vc="avatar-image"]');
        const avatarUrl = imgElement ? imgElement.src : '';
        
        // Get the button ID as assignee ID
        const assigneeId = (element as HTMLElement).id || `assignee_${idCounter++}`;
        
        if (name && avatarUrl) {
          assignees.push({
            id: assigneeId,
            name,
            avatarUrl
          });
          
          // Store the element reference
          assigneeElementMap.set(assigneeId, element as HTMLElement);
        }
      }
    } catch (e) {
      console.error('Error processing menu item element:', e);
    }
  });
  
  // If no menuitemcheckbox found, look for any clickable items with avatars
  if (assignees.length === 0) {
    const clickableItems = dropdownElement.querySelectorAll('a, button, [role="option"], [role="menuitem"]');
    
    clickableItems.forEach(item => {
      try {
        const imgElement = item.querySelector('img');
        if (!imgElement) return;
        
        const avatarUrl = imgElement.src;
        const nameElement = item.querySelector('[class*="name"], [class*="title"]') || item;
        let name = nameElement.textContent?.trim() || 'Unknown';
        
        // Avoid system items or metadata
        if (name === 'Unknown' || name.toLowerCase().includes('unassigned') || name.toLowerCase().includes('none')) {
          return;
        }
        
        const assigneeId = `dropdown_item_${idCounter++}`;
        
        assignees.push({
          id: assigneeId,
          name,
          avatarUrl
        });
        
        // Store the element reference
        assigneeElementMap.set(assigneeId, item as HTMLElement);
      } catch (e) {
        console.error('Error processing clickable item:', e);
      }
    });
  }
}

/**
 * Scan for any other assignee-like elements on the page
 */
async function scanBackupAssignees(startIdCounter: number): Promise<Assignee[]> {
  const assignees: Assignee[] = [];
  let idCounter = startIdCounter;
  
  // Find any avatar images that might be assignees
  document.querySelectorAll('img[alt][src*="avatar"]').forEach(img => {
    const alt = img.getAttribute('alt');
    if (alt && alt.trim() !== '' && !alt.includes('avatar')) {
      const assigneeId = `assignee_${idCounter++}`;
      assignees.push({
        id: assigneeId,
        name: alt,
        avatarUrl: img.src
      });
      
      // Try to find a clickable parent for this image
      const clickableParent = (img as HTMLElement).closest('a, button, [role="button"]');
      if (clickableParent) {
        assigneeElementMap.set(assigneeId, clickableParent as HTMLElement);
      }
    }
  });
  
  return assignees;
}

/**
 * Apply assignee selection to the Jira board
 */
function applyAssigneeSelection(selectedAssigneeIds: string[]): void {
  try {
    // First, clear all selected assignees
    clearAllAssigneeSelections();
    
    // Then select the requested assignees
    selectedAssigneeIds.forEach(async (id) => {
      const element = assigneeElementMap.get(id);
      if (element) {
        await selectAssigneeElement(element);
      }
    });
    
    // Finally, apply the filters if needed
    applyFiltersIfNeeded();
  } catch (error) {
    console.error('Error applying assignee selection:', error);
  }
}

/**
 * Clear all assignee selections
 */
function clearAllAssigneeSelections(): void {
  // Uncheck all visible checkboxes
  document.querySelectorAll('input[type="checkbox"][name="assignee"]').forEach(checkbox => {
    if ((checkbox as HTMLInputElement).checked) {
      (checkbox as HTMLElement).click();
    }
  });
  
  // Uncheck all menu items that are checked
  document.querySelectorAll('button[role="menuitemcheckbox"][aria-checked="true"]').forEach(button => {
    (button as HTMLElement).click();
  });
  
  // Try different approaches for different Jira versions
  // Method 1: Using the clear button if available
  const clearButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
    const text = (btn.textContent || '').toLowerCase();
    return text.includes('clear') || text.includes('reset') || text.includes('remove all');
  });
  
  if (clearButtons.length > 0) {
    // Click the first clear button found
    (clearButtons[0] as HTMLElement).click();
    return;
  }
  
  // Method 2: Click assignee filter button to open dropdown
  const assigneeFilterButtons = Array.from(document.querySelectorAll('button, [role="button"]')).filter(btn => {
    const text = (btn.textContent || '').toLowerCase();
    return text.includes('assignee') && (text.includes('filter') || text.includes('any'));
  });
  
  if (assigneeFilterButtons.length > 0) {
    // Open the dropdown
    (assigneeFilterButtons[0] as HTMLElement).click();
    
    // Look for a "none" or "unassigned" option
    setTimeout(() => {
      const noneOptions = Array.from(document.querySelectorAll('div[role="menuitem"], button[role="menuitem"]')).filter(item => {
        const text = (item.textContent || '').toLowerCase();
        return text.includes('none') || text.includes('unassign') || text.includes('no assignee');
      });
      
      if (noneOptions.length > 0) {
        (noneOptions[0] as HTMLElement).click();
        setTimeout(() => {
          // Re-open the dropdown to make new selections
          (assigneeFilterButtons[0] as HTMLElement).click();
        }, 100);
      }
    }, 200);
  }
}

/**
 * Select a specific assignee element
 */
async function selectAssigneeElement(element: HTMLElement): Promise<void> {

  try {
    // If it's a checkbox
    const checkbox = element.querySelector('input[type="checkbox"]');
    if (checkbox && !(checkbox as HTMLInputElement).checked) {
      (checkbox as HTMLElement).click();
      return;
    }
    
    // If it's a button with aria-checked
    if (element.tagName === 'BUTTON' && element.getAttribute('aria-checked') !== 'true') {
      if (element.checkVisibility()) {
        element.click();
        return;
      } else {
        // Check if we need to open the dropdown to get more assignees
        const needToOpenDropdown = await checkForHiddenDropdown();
        if (needToOpenDropdown) {
          // Open the dropdown
          const dropdownOpened = await openAssigneeDropdown();
          const assigneeMenu = document.querySelector('.css-1u0qf12')?.parentElement;
          if(assigneeMenu) {
            (assigneeMenu as HTMLElement).style.opacity = '0';
          }
          
          if (dropdownOpened) {
            // Give some time for the dropdown to render
            await new Promise(resolve => setTimeout(resolve, 300));
            const assigneeElement = document.querySelector(`button[role="menuitemcheckbox"][id="${element.id}"]`);
            if(assigneeElement?.checkVisibility()) {
              (assigneeElement as HTMLElement).click();
            }
            
            if(assigneeMenu) {
              (assigneeMenu as HTMLElement).style.opacity = '1';
            }
            await closeAssigneeDropdown();
          }
        }
        return;
      }
    }
    
    // Try to find any clickable elements
    const clickableElement = element.closest('button') || 
                           element.querySelector('button') ||
                           element.closest('label') ||
                           element.querySelector('label');
                           
    if (clickableElement) {
      (clickableElement as HTMLElement).click();
    } else {
      // Direct click on the element as last resort
      element.click();
    }

  } catch (e) {
    console.error('Error selecting assignee element:', e);
  }
}

/**
 * Apply filters if needed
 */
function applyFiltersIfNeeded(): void {
  // Look for apply/search/filter buttons
  const applyButton = Array.from(document.querySelectorAll('button')).find(btn => {
    const text = (btn.textContent || '').toLowerCase();
    return text.includes('apply') || text.includes('filter') || text.includes('search');
  });
  
  if (applyButton) {
    (applyButton as HTMLElement).click();
    return;
  }
  
  // Look for "Done" buttons
  const doneButton = Array.from(document.querySelectorAll('button')).find(btn => {
    const text = (btn.textContent || '').toLowerCase();
    return text === 'done' || text === 'apply';
  });
  
  if (doneButton) {
    (doneButton as HTMLElement).click();
    return;
  }
  
  // Press Escape to close any open dropdown
  setTimeout(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      which: 27,
      bubbles: true
    }));
  }, 300);
}

/**
 * Set up MutationObserver to detect changes in the DOM
 */
function setupMutationObserver(): void {
  const observer = new MutationObserver((mutations) => {
    // Check if any mutation added assignee-related elements
    const shouldRescan = mutations.some(mutation => {
      return Array.from(mutation.addedNodes).some(node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return false;
        
        // Check if node or its children contain assignee-related classes or attributes
        return (node as HTMLElement).querySelector && (
          (node as HTMLElement).querySelector('img[src*="avatar"]') ||
          (node as HTMLElement).querySelector('[class*="assignee"]') ||
          (node as HTMLElement).querySelector('input[name="assignee"]') ||
          (node as HTMLElement).querySelector('[role="menuitemcheckbox"]')
        );
      });
    });
    
    // If relevant changes were detected, rescan
    if (shouldRescan) {
      scanJiraAssignees();
    }
  });
  
  // Start observing
  observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'aria-checked']
  });
}

// Initialize when the content script loads
(function init() {
  // Initial scan
  scanJiraAssignees();
  
  // Set up observer
  setupMutationObserver();
  
  // Add a class to the body
  document.body.classList.add('assynaid-extension-active');
  
  console.log('Assynaid Extension initialized');
})();
