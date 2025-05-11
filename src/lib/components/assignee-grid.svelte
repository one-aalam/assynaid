<script lang="ts">
  import AssigneeCard from './assignee-card.svelte';
  import { filteredAssignees } from '$lib/stores/assignees';
  import { uiState } from '$lib/stores/ui';
  import { cn } from '$lib/utils';
  import type { Assignee } from '$lib/models/assignee';
  import LoadingState from './loading-state.svelte';

  export let searchTerm = '';
  export let loading = false;

  let shownAssignees: Assignee[] = [];

  // Filter assignees based on search term
  $: {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      shownAssignees = $filteredAssignees.filter(
        a => a.name.toLowerCase().includes(term) ||
             (a.role && a.role.toLowerCase().includes(term)) ||
             (a.department && a.department.toLowerCase().includes(term))
      );
    } else {
      shownAssignees = $filteredAssignees;
    }
  }

  $: containerClass = cn(
    'grid gap-3 auto-rows-max overflow-y-auto p-4',
    $uiState.currentView === 'grid' 
      ? 'grid-cols-2 sm:grid-cols-3' 
      : 'grid-cols-1'
  );
</script>

{#if loading}
  <LoadingState message="Scanning Jira board..." />
{:else}
  <div class={containerClass}>
    {#each shownAssignees as assignee (assignee.id)}
      <AssigneeCard {assignee} showGroups={true} />
    {/each}
    
    {#if shownAssignees.length === 0}
      <div class="col-span-full flex h-32 items-center justify-center text-center">
        {#if searchTerm}
          <p class="text-muted-foreground">
            No assignees found matching <span class="font-medium">"{searchTerm}"</span>
          </p>
        {:else if $filteredAssignees.length === 0}
          <p class="text-muted-foreground">
            No assignees available. Press the "Scan Now" button to scan the Jira board.
          </p>
        {:else}
          <p class="text-muted-foreground">
            No assignees in the selected group.
          </p>
        {/if}
      </div>
    {/if}
  </div>
{/if}
