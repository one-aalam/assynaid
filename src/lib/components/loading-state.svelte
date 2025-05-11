<script lang="ts">
  export let message = "Loading...";
</script>

<div class="flex flex-1 flex-col items-center justify-center p-8 text-center">
  <div class="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-jira-primary"></div>
  <p class="mt-4 text-muted-foreground">{message}</p>
  
  {#if message.includes('Scanning')}
    <div class="mt-6 max-w-xs text-xs text-muted-foreground">
      <p>Scanning may take a moment as we need to detect both visible and hidden assignees in Jira.</p>
    </div>
  {/if}
</div>
