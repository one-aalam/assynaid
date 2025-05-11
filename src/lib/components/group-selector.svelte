<script lang="ts">
  import { assigneeStore } from '$lib/stores/assignees';
  import { uiState } from '$lib/stores/ui';
  import Button from './ui/button.svelte';
  import GroupBadge from './group-badge.svelte';
  import { createEventDispatcher } from 'svelte';
  import { PlusCircle, Trash2 } from 'lucide-svelte';
  import { toast } from 'svelte-sonner';
  import ConfirmationDialog from './confirmation-dialog.svelte';

  const dispatch = createEventDispatcher<{
    createGroup: void;
    editGroup: { groupId: string };
  }>();

  // State for delete confirmation
  let showDeleteConfirmation = false;
  let groupToDelete: { id: string; name: string } | null = null;

  function handleGroupChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    assigneeStore.setCurrentGroup(select.value);
  }

  function handleCreateGroup() {
    dispatch('createGroup');
  }
  
  function handleEditGroup(groupId: string) {
    dispatch('editGroup', { groupId });
  }
  
  function openDeleteConfirmation(groupId: string, groupName: string) {
    groupToDelete = { id: groupId, name: groupName };
    showDeleteConfirmation = true;
  }
  
  function handleDeleteGroup() {
    if (!groupToDelete) return;
    
    assigneeStore.removeGroup(groupToDelete.id);
    toast.success(`Group "${groupToDelete.name}" deleted`);
    groupToDelete = null;
  }
</script>

<div 
  class="flex items-center justify-between gap-2 border-b bg-muted/40 p-3"
  class:hidden={$uiState.currentView !== 'group'}
>
  <div class="flex-1">
    <select
      class="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
      value={$assigneeStore.currentGroupId || 'all'}
      on:change={handleGroupChange}
    >
      <option value="all">All Assignees</option>
      {#each $assigneeStore.groups as group (group.id)}
        <option value={group.id}>{group.name} ({group.assigneeIds.length})</option>
      {/each}
    </select>
  </div>
  
  <Button 
    variant="outline" 
    size="sm" 
    class="px-2 py-1 h-auto"
    on:click={handleCreateGroup}
  >
    <PlusCircle class="mr-1 h-3.5 w-3.5" />
    New Group
  </Button>
</div>

{#if $uiState.currentView === 'group' && $assigneeStore.groups.length > 0}
  <div class="flex flex-wrap gap-1 p-2 border-b bg-muted/20">
    <Button
      variant={$assigneeStore.currentGroupId === null || $assigneeStore.currentGroupId === 'all' ? 'secondary' : 'outline'}
      size="sm"
      class="text-xs h-auto py-1"
      on:click={() => assigneeStore.setCurrentGroup('all')}
    >
      All
    </Button>

    {#each $assigneeStore.groups as group (group.id)}
      <div class="flex items-center">
        <button
          class="flex items-center group"
          on:click={() => assigneeStore.setCurrentGroup(group.id)}
        >
          <GroupBadge 
            {group} 
            showCount={true} 
            size="sm"
          />
        </button>
        
        <button 
          class="ml-1 p-1 rounded-full opacity-60 hover:opacity-100 hover:bg-muted"
          title="Delete group"
          on:click={() => openDeleteConfirmation(group.id, group.name)}
        >
          <Trash2 class="h-3 w-3 text-destructive" />
        </button>
      </div>
    {/each}
  </div>
{/if}

<!-- Delete Confirmation Dialog -->
<ConfirmationDialog
  bind:show={showDeleteConfirmation}
  title="Delete Group"
  message={groupToDelete ? `Are you sure you want to delete the group "${groupToDelete.name}"? This action cannot be undone.` : ''}
  confirmText="Delete"
  cancelText="Cancel"
  destructive={true}
  on:confirm={handleDeleteGroup}
/>
