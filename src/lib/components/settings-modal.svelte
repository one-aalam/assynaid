<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { X, UserCircle, Moon, Sun, Eye, EyeOff } from 'lucide-svelte';
  import Button from './ui/button.svelte';
  import { assigneeStore } from '$lib/stores/assignees';
  import { uiState, theme, toggleTheme } from '$lib/stores/ui';
  import { fade } from 'svelte/transition';
  import { toast } from 'svelte-sonner';

  export let show = false;

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  function close() {
    dispatch('close');
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      close();
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      close();
    }
  }

  function toggleAvatarDisplay() {
    $uiState.showAvatar = !$uiState.showAvatar;
    toast.success(`Avatar display ${$uiState.showAvatar ? 'enabled' : 'disabled'}`);
  }

  async function clearAllData() {
    if (
      confirm(
        'Are you sure you want to clear all data? This will remove all scanned assignees, selections, and groups.'
      )
    ) {
      await assigneeStore.reset();
      toast.success('All data has been cleared');
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    transition:fade={{ duration: 200 }}
    on:click={handleBackdropClick}
  >
    <div
      class="w-full max-w-md animate-slide-in overflow-hidden rounded-md bg-background shadow-lg"
      on:click|stopPropagation
    >
      <div class="flex items-center justify-between border-b p-4">
        <h2 class="text-lg font-semibold">Settings</h2>
        <button class="rounded-full p-1 hover:bg-muted" on:click={close} aria-label="Close">
          <X class="h-5 w-5" />
        </button>
      </div>

      <div class="space-y-4 p-4">
        <div class="space-y-4">
          <h3 class="text-base font-medium">Appearance</h3>

          <div class="flex items-center justify-between rounded-md border p-3">
            <div class="flex items-center gap-3">
              {#if $theme === 'dark'}
                <Moon class="h-5 w-5 text-jira-tertiary" />
              {:else}
                <Sun class="h-5 w-5 text-jira-warning" />
              {/if}
              <span>Theme</span>
            </div>
            <Button variant="outline" size="sm" on:click={toggleTheme}>
              {$theme === 'dark' ? 'Light' : 'Dark'} Mode
            </Button>
          </div>

          <div class="flex items-center justify-between rounded-md border p-3">
            <div class="flex items-center gap-3">
              {#if $uiState.showAvatar}
                <UserCircle class="h-5 w-5 text-jira-tertiary" />
              {:else}
                <UserCircle class="h-5 w-5 text-muted-foreground" />
              {/if}
              <span>Show Avatars</span>
            </div>
            <Button variant="outline" size="sm" on:click={toggleAvatarDisplay}>
              {#if $uiState.showAvatar}
                <EyeOff class="mr-2 h-4 w-4" />
                Hide
              {:else}
                <Eye class="mr-2 h-4 w-4" />
                Show
              {/if}
            </Button>
          </div>
        </div>

        <div class="space-y-4 border-t pt-4">
          <h3 class="text-base font-medium">Data Management</h3>

          <div class="flex items-center justify-between rounded-md border p-3">
            <div>
              <p class="text-sm">Current data</p>
              <p class="text-xs text-muted-foreground">
                {$assigneeStore.assignees.length} assignees,
                {$assigneeStore.groups.length} groups
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              class="border-destructive text-destructive"
              on:click={clearAllData}
            >
              Clear All Data
            </Button>
          </div>

          {#if $assigneeStore.lastScanTime}
            <p class="text-xs text-muted-foreground">
              Last scan: {new Date($assigneeStore.lastScanTime).toLocaleString()}
            </p>
          {/if}
        </div>

        <div class="border-t pt-4">
          <p class="text-xs text-muted-foreground">
            Assynaid v1.0.0 - A modern Jira assignee scanner
          </p>
          <p class="mt-1 text-xs text-muted-foreground">
            <a
              href="https://github.com/yourusername/assynaid"
              target="_blank"
              class="text-jira-tertiary hover:underline"
            >
              View on GitHub
            </a>
          </p>
        </div>
      </div>

      <div class="flex justify-end border-t p-4">
        <Button variant="jira" on:click={close}>Close</Button>
      </div>
    </div>
  </div>
{/if}
