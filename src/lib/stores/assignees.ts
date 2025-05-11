import { writable, derived, get } from 'svelte/store';
import type { Assignee, AssigneeGroup, AssigneeState } from '$lib/models/assignee';
import { initialState } from '$lib/models/assignee';
import { generateRandomId } from '$lib/utils';

// Create the main store
const createAssigneeStore = () => {
  const { subscribe, set, update } = writable<AssigneeState>(initialState);

  // Load from Chrome storage
  const loadFromStorage = async () => {
    return new Promise<void>((resolve) => {
      chrome.storage.local.get(['assigneeState'], (result) => {
        if (result.assigneeState) {
          set(result.assigneeState);
        }
        resolve();
      });
    });
  };

  // Save to Chrome storage
  const saveToStorage = async (state: AssigneeState) => {
    return new Promise<void>((resolve) => {
      chrome.storage.local.set({ assigneeState: state }, resolve);
    });
  };

  return {
    subscribe,
    setAssignees: async (assignees: Assignee[]) => {
      const newState = update((state) => {
        return { ...state, assignees, lastScanTime: Date.now() };
      });
      await saveToStorage(get({ subscribe }));
      return newState;
    },
    toggleSelection: async (assigneeId: string) => {
      update((state) => {
        const isSelected = state.selectedAssigneeIds.includes(assigneeId);
        const selectedAssigneeIds = isSelected
          ? state.selectedAssigneeIds.filter((id) => id !== assigneeId)
          : [...state.selectedAssigneeIds, assigneeId];
        return { ...state, selectedAssigneeIds };
      });
      await saveToStorage(get({ subscribe }));
    },
    setSelectedAssignees: async (assigneeIds: string[]) => {
      update((state) => ({ ...state, selectedAssigneeIds: assigneeIds }));
      await saveToStorage(get({ subscribe }));
    },
    clearSelection: async () => {
      update((state) => ({ ...state, selectedAssigneeIds: [] }));
      await saveToStorage(get({ subscribe }));
    },
    addGroup: async (name: string, description: string, assigneeIds: string[], color?: string) => {
      const group: AssigneeGroup = {
        id: generateRandomId(),
        name,
        description,
        assigneeIds,
        color: color || `hsl(${Math.random() * 360}, 70%, 60%)`,
        createdAt: Date.now()
      };

      update((state) => ({
        ...state,
        groups: [...state.groups, group],
        currentGroupId: group.id
      }));
      await saveToStorage(get({ subscribe }));
      return group.id;
    },
    updateGroup: async (groupId: string, updates: Partial<AssigneeGroup>) => {
      update((state) => {
        const groupIndex = state.groups.findIndex((g) => g.id === groupId);
        if (groupIndex === -1) return state;

        const updatedGroups = [...state.groups];
        updatedGroups[groupIndex] = {
          ...updatedGroups[groupIndex],
          ...updates
        };

        return { ...state, groups: updatedGroups };
      });
      await saveToStorage(get({ subscribe }));
    },
    removeGroup: async (groupId: string) => {
      update((state) => {
        const groups = state.groups.filter((g) => g.id !== groupId);
        const currentGroupId = state.currentGroupId === groupId ? null : state.currentGroupId;
        return { ...state, groups, currentGroupId };
      });
      await saveToStorage(get({ subscribe }));
    },
    setCurrentGroup: async (groupId: string | null) => {
      update((state) => ({ ...state, currentGroupId: groupId }));
      await saveToStorage(get({ subscribe }));
    },
    addAssigneeToGroup: async (groupId: string, assigneeId: string) => {
      update((state) => {
        const groupIndex = state.groups.findIndex((g) => g.id === groupId);
        if (groupIndex === -1) return state;

        const group = state.groups[groupIndex];
        if (group.assigneeIds.includes(assigneeId)) return state;

        const updatedGroups = [...state.groups];
        updatedGroups[groupIndex] = {
          ...group,
          assigneeIds: [...group.assigneeIds, assigneeId]
        };

        return { ...state, groups: updatedGroups };
      });
      await saveToStorage(get({ subscribe }));
    },
    removeAssigneeFromGroup: async (groupId: string, assigneeId: string) => {
      update((state) => {
        const groupIndex = state.groups.findIndex((g) => g.id === groupId);
        if (groupIndex === -1) return state;

        const group = state.groups[groupIndex];
        const updatedGroups = [...state.groups];
        updatedGroups[groupIndex] = {
          ...group,
          assigneeIds: group.assigneeIds.filter((id) => id !== assigneeId)
        };

        return { ...state, groups: updatedGroups };
      });
      await saveToStorage(get({ subscribe }));
    },
    reset: async () => {
      set(initialState);
      await saveToStorage(initialState);
    },
    init: async () => {
      await loadFromStorage();
    }
  };
};

// Create the store singleton
export const assigneeStore = createAssigneeStore();

// Derived stores for convenience
export const filteredAssignees = derived(assigneeStore, ($store) => {
  if (!$store.currentGroupId || $store.currentGroupId === 'all') {
    return $store.assignees;
  }

  const group = $store.groups.find((g) => g.id === $store.currentGroupId);
  if (!group) return $store.assignees;

  return $store.assignees.filter((a) => group.assigneeIds.includes(a.id));
});

// Get all groups for a specific assignee
export const getGroupsForAssignee = derived(assigneeStore, ($store) => {
  return (assigneeId: string) => {
    return $store.groups.filter((group) => group.assigneeIds.includes(assigneeId));
  };
});

// Check if an assignee is selected
export const isAssigneeSelected = derived(assigneeStore, ($store) => {
  return (assigneeId: string) => {
    return $store.selectedAssigneeIds.includes(assigneeId);
  };
});
