<script lang="ts">
  import { Grid, List, Group } from 'lucide-svelte';
  import { uiState } from '$lib/stores/ui';
  import { cn } from '$lib/utils';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    change: string;
  }>();

  function setView(view: string) {
    $uiState.currentView = view;
    dispatch('change', view);
  }

  $: gridButtonClass = cn(
    'flex h-8 items-center justify-center rounded-l-md border px-3 text-sm transition-colors',
    $uiState.currentView === 'grid'
      ? 'bg-jira-primary text-white border-jira-primary'
      : 'bg-card hover:bg-muted'
  );

  $: listButtonClass = cn(
    'flex h-8 items-center justify-center border-y border-r px-3 text-sm transition-colors',
    $uiState.currentView === 'list'
      ? 'bg-jira-primary text-white border-jira-primary'
      : 'bg-card hover:bg-muted'
  );

  $: groupButtonClass = cn(
    'flex h-8 items-center justify-center rounded-r-md border-y border-r px-3 text-sm transition-colors',
    $uiState.currentView === 'group'
      ? 'bg-jira-primary text-white border-jira-primary'
      : 'bg-card hover:bg-muted'
  );
</script>

<div class="flex">
  <button
    type="button"
    class={gridButtonClass}
    on:click={() => setView('grid')}
    aria-label="Grid view"
  >
    <Grid class="h-4 w-4" />
  </button>
  
  <button
    type="button"
    class={listButtonClass}
    on:click={() => setView('list')}
    aria-label="List view"
  >
    <List class="h-4 w-4" />
  </button>
  
  <button
    type="button"
    class={groupButtonClass}
    on:click={() => setView('group')}
    aria-label="Group view"
  >
    <Group class="h-4 w-4" />
  </button>
</div>
