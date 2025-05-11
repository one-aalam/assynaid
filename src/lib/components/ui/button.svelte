<script lang="ts">
  import { cva, type VariantProps } from 'class-variance-authority';
  import { cn } from '$lib/utils';

  const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
    {
      variants: {
        variant: {
          default: 'bg-primary text-primary-foreground hover:bg-primary/90',
          destructive:
            'bg-destructive text-destructive-foreground hover:bg-destructive/90',
          outline:
            'border border-input hover:bg-accent hover:text-accent-foreground',
          secondary:
            'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          ghost: 'hover:bg-accent hover:text-accent-foreground',
          link: 'underline-offset-4 hover:underline text-primary',
          jira: 'bg-jira-primary text-white hover:bg-jira-secondary',
          success: 'bg-jira-success text-white hover:bg-jira-success/90',
        },
        size: {
          default: 'h-10 py-2 px-4',
          sm: 'h-9 px-3 rounded-md',
          lg: 'h-11 px-8 rounded-md',
          icon: 'h-10 w-10',
        },
      },
      defaultVariants: {
        variant: 'default',
        size: 'default',
      },
    }
  );

  type ButtonProps = VariantProps<typeof buttonVariants>;

  let className: string = '';
  export { className as class };
  export let variant: ButtonProps['variant'] = 'default';
  export let size: ButtonProps['size'] = 'default';
  export let disabled = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
</script>

<button
  {type}
  class={cn(buttonVariants({ variant, size, className }))}
  {disabled}
  {...$$restProps}
  on:click
  on:keydown
>
  <slot />
</button>
