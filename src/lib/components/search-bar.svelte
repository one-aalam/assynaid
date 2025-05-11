<script lang="ts">
  import { Search, X } from 'lucide-svelte';
  import { uiState } from '$lib/stores/ui';
  import { debounce } from '$lib/utils';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    search: string;
  }>();

  // Debounced search
  const debouncedSearch = debounce((value: string) => {
    dispatch('search', value);
  }, 300);

  function handleInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    $uiState.searchTerm = value;
    debouncedSearch(value);
  }

  function clearSearch() {
    $uiState.searchTerm = '';
    dispatch('search', '');
  }
</script>

<div class="relative">
  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
    <Search class="h-4 w-4 text-muted-foreground" />
  </div>

  <input
    type="text"
    placeholder="Search assignees..."
    class="w-full rounded-md border border-input bg-background py-2 pl-10 pr-10 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    value={$uiState.searchTerm}
    on:input={handleInput}
  />

  {#if $uiState.searchTerm}
    <button
      type="button"
      class="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-foreground"
      on:click={clearSearch}
    >
      <X class="h-4 w-4 text-muted-foreground hover:text-foreground" />
    </button>
  {/if}
</div>
