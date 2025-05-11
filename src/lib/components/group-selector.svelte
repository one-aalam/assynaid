<script lang="ts">
  import { assigneeStore } from '$lib/stores/assignees';
  import { uiState } from '$lib/stores/ui';
  import Button from './ui/button.svelte';
  import GroupBadge from './group-badge.svelte';
  import { createEventDispatcher } from 'svelte';
  import { PlusCircle } from 'lucide-svelte';

  const dispatch = createEventDispatcher<{
    createGroup: void;
  }>();

  function handleGroupChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    assigneeStore.setCurrentGroup(select.value);
  }

  function handleCreateGroup() {
    dispatch('createGroup');
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
      <button
        class="flex items-center"
        on:click={() => assigneeStore.setCurrentGroup(group.id)}
      >
        <GroupBadge 
          {group} 
          showCount={true} 
          size="sm"
        />
      </button>
    {/each}
  </div>
{/if}
