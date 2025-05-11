<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { X } from 'lucide-svelte';
  import { assigneeStore } from '$lib/stores/assignees';
  import Button from './ui/button.svelte';
  import Input from './ui/input.svelte';
  import { toast } from 'svelte-sonner';
  import { fade } from 'svelte/transition';

  export let show = false;

  let name = '';
  let description = '';
  let color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
  let selectedAssigneeIds: string[] = [];

  const dispatch = createEventDispatcher<{
    close: void;
    created: { id: string };
  }>();

  function close() {
    dispatch('close');
  }

  async function handleSubmit() {
    if (!name) {
      toast.error('Please enter a group name');
      return;
    }

    if (selectedAssigneeIds.length === 0) {
      // If no assignees selected, use the currently selected ones
      if ($assigneeStore.selectedAssigneeIds.length === 0) {
        toast.error('Please select at least one assignee');
        return;
      }
      selectedAssigneeIds = [...$assigneeStore.selectedAssigneeIds];
    }

    try {
      const groupId = await assigneeStore.addGroup(name, description, selectedAssigneeIds, color);
      toast.success(`Group "${name}" created successfully!`);
      dispatch('created', { id: groupId });
      resetForm();
      close();
    } catch (error) {
      toast.error('Failed to create group');
      console.error('Failed to create group:', error);
    }
  }

  function resetForm() {
    name = '';
    description = '';
    color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
    selectedAssigneeIds = [];
  }

  // Reset form when modal is opened
  $: if (show) {
    resetForm();
    // Pre-select currently selected assignees
    selectedAssigneeIds = [...$assigneeStore.selectedAssigneeIds];
  }

  function toggleAssignee(id: string) {
    if (selectedAssigneeIds.includes(id)) {
      selectedAssigneeIds = selectedAssigneeIds.filter((i) => i !== id);
    } else {
      selectedAssigneeIds = [...selectedAssigneeIds, id];
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      close();
    }
  }

  // Close modal when clicking outside
  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      close();
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
        <h2 class="text-lg font-semibold">Create New Group</h2>
        <button class="rounded-full p-1 hover:bg-muted" on:click={close} aria-label="Close">
          <X class="h-5 w-5" />
        </button>
      </div>

      <form on:submit|preventDefault={handleSubmit} class="space-y-4 p-4">
        <div class="space-y-2">
          <label for="name" class="text-sm font-medium">
            Group Name <span class="text-destructive">*</span>
          </label>
          <Input id="name" bind:value={name} placeholder="Enter group name" />
        </div>

        <div class="space-y-2">
          <label for="description" class="text-sm font-medium">Description</label>
          <textarea
            id="description"
            bind:value={description}
            placeholder="Enter description (optional)"
            class="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          ></textarea>
        </div>

        <div class="space-y-2">
          <label for="color" class="text-sm font-medium">Color</label>
          <div class="flex items-center gap-3">
            <input
              type="color"
              id="color"
              bind:value={color}
              class="h-10 w-16 cursor-pointer rounded border p-0"
            />
            <div
              class="flex-1 rounded-md p-2 text-center font-medium text-white"
              style="background-color: {color}"
            >
              {name || 'Preview'}
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">
            Assignees <span class="text-destructive">*</span>
            <span class="ml-1 text-xs text-muted-foreground">
              ({selectedAssigneeIds.length} selected)
            </span>
          </label>

          <div class="max-h-60 overflow-y-auto rounded-md border p-1">
            {#if $assigneeStore.assignees.length === 0}
              <div class="p-4 text-center text-muted-foreground">
                No assignees available. Please scan first.
              </div>
            {:else}
              {#each $assigneeStore.assignees as assignee (assignee.id)}
                <div
                  class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted"
                  on:click={() => toggleAssignee(assignee.id)}
                  on:keydown={(e) => e.key === 'Enter' && toggleAssignee(assignee.id)}
                >
                  <input
                    type="checkbox"
                    id={`assignee-${assignee.id}`}
                    checked={selectedAssigneeIds.includes(assignee.id)}
                    class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    on:change={() => toggleAssignee(assignee.id)}
                  />

                  {#if assignee.avatarUrl}
                    <img
                      src={assignee.avatarUrl}
                      alt={assignee.name}
                      class="h-6 w-6 rounded-full object-cover"
                    />
                  {:else}
                    <div
                      class="flex h-6 w-6 items-center justify-center rounded-full bg-jira-primary text-xs text-white"
                    >
                      {assignee.name.substring(0, 2).toUpperCase()}
                    </div>
                  {/if}

                  <label for={`assignee-${assignee.id}`} class="flex-1 cursor-pointer text-sm">
                    {assignee.name}
                  </label>
                </div>
              {/each}
            {/if}
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" on:click={close}>Cancel</Button>
          <Button variant="jira" type="submit">Create Group</Button>
        </div>
      </form>
    </div>
  </div>
{/if}
