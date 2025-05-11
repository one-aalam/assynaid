<script lang="ts">
  import { assigneeStore, filteredAssignees } from '$lib/stores/assignees';
  import { uiState } from '$lib/stores/ui';
  import Button from './ui/button.svelte';
  import { Check, Copy, FileDown } from 'lucide-svelte';
  import { downloadCSV } from '$lib/utils';
  import { createEventDispatcher } from 'svelte';
  import { toast } from 'svelte-sonner';

  export let totalCount = 0;
  export let selectedCount = 0;

  const dispatch = createEventDispatcher<{
    apply: void;
  }>();

  function handleApply() {
    if ($assigneeStore.selectedAssigneeIds.length === 0) {
      toast.error('Please select at least one assignee');
      return;
    }

    $uiState.isAnimatingOut = true;
    dispatch('apply');
  }

  function copyToClipboard() {
    const assigneesToCopy =
      $assigneeStore.selectedAssigneeIds.length > 0
        ? $assigneeStore.assignees.filter((a) => $assigneeStore.selectedAssigneeIds.includes(a.id))
        : $filteredAssignees;

    const text = assigneesToCopy.map((a) => a.name).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  }

  function exportToCsv() {
    const assigneesToExport =
      $assigneeStore.selectedAssigneeIds.length > 0
        ? $assigneeStore.assignees.filter((a) => $assigneeStore.selectedAssigneeIds.includes(a.id))
        : $filteredAssignees;

    const headers = ['Name', 'Avatar URL', 'Role', 'Groups'];
    const rows = assigneesToExport.map((assignee) => {
      const groups = $assigneeStore.groups
        .filter((g) => g.assigneeIds.includes(assignee.id))
        .map((g) => g.name)
        .join('; ');

      return [assignee.name, assignee.avatarUrl || '', assignee.role || '', groups];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    downloadCSV(csvContent, 'jira_assignees.csv');
    toast.success('CSV exported!');
  }
</script>

<footer class="flex items-center justify-between border-t bg-card px-4 py-3">
  <div class="text-sm">
    <span>{totalCount} assignee{totalCount !== 1 ? 's' : ''}</span>
    {#if selectedCount > 0}
      <span class="ml-1 text-jira-tertiary">({selectedCount} selected)</span>
    {/if}
  </div>

  <div class="flex items-center gap-2">
    <Button variant="outline" size="sm" on:click={copyToClipboard} title="Copy names to clipboard">
      <Copy class="mr-1 h-3.5 w-3.5" />
      Copy
    </Button>

    <Button variant="outline" size="sm" on:click={exportToCsv} title="Export to CSV">
      <FileDown class="mr-1 h-3.5 w-3.5" />
      Export
    </Button>

    <Button
      variant="success"
      size="sm"
      on:click={handleApply}
      disabled={$assigneeStore.selectedAssigneeIds.length === 0}
      title="Apply selection to Jira board"
    >
      <Check class="mr-1 h-3.5 w-3.5" />
      Apply Selection
    </Button>
  </div>
</footer>
