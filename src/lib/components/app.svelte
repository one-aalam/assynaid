<script lang="ts">
  import { onMount } from 'svelte';
  import { toast, Toaster } from 'svelte-sonner';
  import { assigneeStore } from '$lib/stores/assignees';
  import { uiState, initTheme } from '$lib/stores/ui';
  import Header from './header.svelte';
  import SearchBar from './search-bar.svelte';
  import ViewSelector from './view-selector.svelte';
  import GroupSelector from './group-selector.svelte';
  import AssigneeGrid from './assignee-grid.svelte';
  import Footer from './footer.svelte';
  import CreateGroupModal from './create-group-modal.svelte';
  import SettingsModal from './settings-modal.svelte';
  import { cn } from '$lib/utils';
  import LoadingState from './loading-state.svelte';

  let isScanning = false;
  let isApplying = false;
  let searchTerm = '';
  let showSettings = false;
  let scanningStatus = '';

  onMount(async () => {
    initTheme();
    await assigneeStore.init();
  });

  async function scanAssignees() {
    if (isScanning) return;

    isScanning = true;
    $uiState.isLoading = true;
    scanningStatus = 'Scanning Jira board...';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error("No active tab found");
      }

      scanningStatus = 'Looking for assignees...';
      
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'scanAssignees' });
      
      if (response && response.assignees && response.assignees.length > 0) {
        scanningStatus = 'Processing assignees...';
        await assigneeStore.setAssignees(response.assignees);
        toast.success(`Found ${response.assignees.length} assignees`);
      } else {
        toast.error('No assignees found. Are you on a Jira board?');
      }
    } catch (error) {
      console.error('Scanning error:', error);
      toast.error('Failed to scan Jira board. Please check if you are on a Jira board.');
    } finally {
      isScanning = false;
      $uiState.isLoading = false;
      scanningStatus = '';
    }
  }

  async function applySelection() {
    if (isApplying) return;

    isApplying = true;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error("No active tab found");
      }

      toast.success(`Applying ${$assigneeStore.selectedAssigneeIds.length} assignees to Jira board...`);
      
      await chrome.tabs.sendMessage(tab.id, { 
        action: 'applyAssigneeSelection',
        selectedAssigneeIds: $assigneeStore.selectedAssigneeIds
      });

      // Allow time for animation
      setTimeout(() => {
        window.close();
      }, 300);
    } catch (error) {
      console.error('Apply selection error:', error);
      toast.error('Failed to apply selection to Jira board');
      $uiState.isAnimatingOut = false;
      isApplying = false;
    }
  }

  function handleSearch(event: CustomEvent<string>) {
    searchTerm = event.detail;
  }

  function handleViewChange(event: CustomEvent<string>) {
    // View already changed in the component
    console.log('View changed to:', event.detail);
  }

  function handleCreateGroup() {
    $uiState.isCreatingGroup = true;
  }
  
  function handleOpenSettings() {
    showSettings = true;
  }
</script>

<div 
  class={cn(
    'flex h-[600px] w-[400px] flex-col',
    $uiState.isAnimatingOut && 'container closing'
  )}
>
  <Header 
    scanning={isScanning} 
    on:scan={scanAssignees}
    on:openSettings={handleOpenSettings}
  />
  
  <div class="flex items-center justify-between gap-3 border-b p-3">
    <div class="flex-1">
      <SearchBar on:search={handleSearch} />
    </div>
    <ViewSelector on:change={handleViewChange} />
  </div>
  
  <GroupSelector on:createGroup={handleCreateGroup} />
  
  <div class="flex-1 overflow-y-auto">
    {#if $uiState.isLoading}
      <LoadingState message={scanningStatus || 'Loading...'} />
    {:else}
      <AssigneeGrid {searchTerm} loading={false} />
    {/if}
  </div>
  
  <Footer 
    totalCount={$assigneeStore.assignees.length} 
    selectedCount={$assigneeStore.selectedAssigneeIds.length}
    on:apply={applySelection}
  />
  
  <CreateGroupModal 
    show={$uiState.isCreatingGroup} 
    on:close={() => $uiState.isCreatingGroup = false}
    on:created={(e) => {
      $uiState.currentView = 'group';
      assigneeStore.setCurrentGroup(e.detail.id);
    }}
  />
  
  <SettingsModal
    show={showSettings}
    on:close={() => showSettings = false}
  />
  
  <Toaster position="top-center" closeButton />
</div>
