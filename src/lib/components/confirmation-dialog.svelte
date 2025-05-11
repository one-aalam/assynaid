<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import Button from './ui/button.svelte';
  import { AlertTriangle } from 'lucide-svelte';

  export let show = false;
  export let title = 'Confirm Action';
  export let message = 'Are you sure you want to proceed?';
  export let confirmText = 'Confirm';
  export let cancelText = 'Cancel';
  export let destructive = true;

  const dispatch = createEventDispatcher<{
    confirm: void;
    cancel: void;
  }>();

  function confirm() {
    dispatch('confirm');
    show = false;
  }

  function cancel() {
    dispatch('cancel');
    show = false;
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      cancel();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      cancel();
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
      class="w-full max-w-sm overflow-hidden rounded-md bg-background shadow-lg"
      on:click|stopPropagation
      transition:fade={{ duration: 150 }}
    >
      <div class="p-4">
        <div class="flex items-start gap-3">
          {#if destructive}
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle class="h-5 w-5 text-destructive" />
            </div>
          {/if}
          
          <div class="flex-1">
            <h3 class="text-lg font-medium">{title}</h3>
            <p class="mt-1 text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      </div>
      
      <div class="flex items-center justify-end gap-2 border-t p-3 bg-muted/20">
        <Button variant="outline" type="button" on:click={cancel}>
          {cancelText}
        </Button>
        <Button 
          variant={destructive ? "destructive" : "default"} 
          type="button" 
          on:click={confirm}
        >
          {confirmText}
        </Button>
      </div>
    </div>
  </div>
{/if}
