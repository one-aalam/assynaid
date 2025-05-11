<script lang="ts">
  import { cn } from '$lib/utils';
  import type { AssigneeGroup } from '$lib/models/assignee';

  export let group: AssigneeGroup;
  export let size: 'sm' | 'md' = 'sm';
  export let showCount = false;
</script>

<div 
  class={cn(
    'inline-flex items-center rounded-full px-2 font-medium text-white',
    size === 'sm' ? 'py-0.5 text-xs' : 'py-1 text-sm'
  )}
  style="background-color: {group.color}"
  title={group.description || group.name}
>
  <span class="truncate max-w-24">{group.name}</span>
  {#if showCount}
    <span class="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/30 text-[10px]">
      {group.assigneeIds.length}
    </span>
  {/if}
</div>
