<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Scan, MoonIcon, SunIcon, Settings } from 'lucide-svelte';
  import Button from './ui/button.svelte';
  import { theme, toggleTheme } from '$lib/stores/ui';
  import { cn } from '$lib/utils';

  export let scanning = false;

  const dispatch = createEventDispatcher<{
    scan: void;
    openSettings: void;
  }>();

  function handleScan() {
    dispatch('scan');
  }

  function openSettings() {
    dispatch('openSettings');
  }
</script>

<header class="flex items-center justify-between border-b bg-card px-4 py-3">
  <div class="flex items-center gap-2">
    <img src="../assets/images/logo.svg" alt="Assynaid Logo" class="h-8 w-8" />
    <h1 class="text-xl font-semibold text-jira-primary">Assynaid</h1>
  </div>

  <div class="flex items-center gap-2">
    <Button
      variant="ghost"
      size="icon"
      class="h-8 w-8"
      on:click={toggleTheme}
      aria-label={$theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {#if $theme === 'dark'}
        <SunIcon class="h-4 w-4" />
      {:else}
        <MoonIcon class="h-4 w-4" />
      {/if}
    </Button>

    <Button
      variant="ghost"
      size="icon"
      class="h-8 w-8"
      on:click={openSettings}
      aria-label="Settings"
    >
      <Settings class="h-4 w-4" />
    </Button>

    <Button
      variant="jira"
      size="sm"
      class={cn(scanning && 'opacity-70')}
      disabled={scanning}
      on:click={handleScan}
    >
      <Scan class="mr-2 h-4 w-4" />
      {scanning ? 'Scanning...' : 'Scan Now'}
    </Button>
  </div>
</header>
