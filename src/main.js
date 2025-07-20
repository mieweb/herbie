import App from './App.svelte';
import 'mie-ds-brand-grayscale-light/dist/styles.css';
const app = new App({
	target: document.body,
	props: {
		name: 'world'
	}
});

export default app;