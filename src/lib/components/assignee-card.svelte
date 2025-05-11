<script lang="ts">
  import { assigneeStore, getGroupsForAssignee, isAssigneeSelected } from '$lib/stores/assignees';
  import { uiState } from '$lib/stores/ui';
  import { cn, getInitials } from '$lib/utils';
  import type { Assignee } from '$lib/models/assignee';
  import GroupBadge from './group-badge.svelte';
  import { createEventDispatcher } from 'svelte';

  export let assignee: Assignee;
  export let showGroups = true;

  const dispatch = createEventDispatcher<{
    select: { assignee: Assignee };
  }>();

  let selected = false;
  $: selected = $isAssigneeSelected(assignee.id);

  let groups = [];
  $: groups = $getGroupsForAssignee(assignee.id);

  function handleSelect() {
    dispatch('select', { assignee });
    assigneeStore.toggleSelection(assignee.id);
  }

  $: cardClasses = cn(
    'relative flex rounded-md border bg-card p-3 shadow-sm transition-all cursor-pointer',
    $uiState.currentView === 'list' 
      ? 'flex-row items-center gap-3 hover:bg-muted/50' 
      : 'flex-col items-center gap-2 hover:shadow-md hover:-translate-y-1',
    selected && 'ring-2 ring-jira-tertiary bg-accent/10 animate-pulse-highlight'
  );

  $: showCheckmark = selected;
</script>

<div class={cardClasses} on:click={handleSelect} on:keydown={(e) => e.key === 'Enter' && handleSelect()}>
  {#if showCheckmark}
    <div class="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-jira-tertiary text-white">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
  {/if}

  {#if $uiState.showAvatar}
    <div class="relative">
      {#if assignee.avatarUrl}
        <img 
          src={assignee.avatarUrl} 
          alt={assignee.name} 
          class={cn(
            'rounded-full object-cover ring-2 ring-background', 
            $uiState.currentView === 'list' ? 'h-10 w-10' : 'h-14 w-14'
          )}
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        />
        <div 
          class={cn(
            'hidden items-center justify-center rounded-full bg-jira-primary text-white font-semibold', 
            $uiState.currentView === 'list' ? 'h-10 w-10 text-xs' : 'h-14 w-14 text-sm'
          )}
        >
          {getInitials(assignee.name)}
        </div>
      {:else}
        <div 
          class={cn(
            'flex items-center justify-center rounded-full bg-jira-primary text-white font-semibold', 
            $uiState.currentView === 'list' ? 'h-10 w-10 text-xs' : 'h-14 w-14 text-sm'
          )}
        >
          {getInitials(assignee.name)}
        </div>
      {/if}
    </div>
  {/if}

  <div class={cn(
    'flex min-w-0',
    $uiState.currentView === 'list' ? 'flex-1 flex-row items-center gap-3' : 'flex-col items-center text-center'
  )}>
    <div class="min-w-0 flex-1">
      <p class="truncate font-medium">{assignee.name}</p>
      {#if assignee.role}
        <p class="text-xs text-muted-foreground truncate">{assignee.role}</p>
      {/if}
    </div>

    {#if showGroups && groups.length > 0 && ($uiState.currentView === 'list' || $uiState.currentView === 'group')}
      <div class="flex flex-wrap gap-1">
        {#each groups as group (group.id)}
          <GroupBadge {group} />
        {/each}
      </div>
    {/if}
  </div>
</div>
