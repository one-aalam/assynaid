import App from '$lib/components/app.svelte';
import '../app.css';

const app = new App({
  target: document.getElementById('app') as HTMLElement
});

export default app;
