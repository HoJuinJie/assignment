<script>
	import { Toaster } from 'svelte-sonner';
</script>

<Toaster style="z-index: 12;" expand={true} richColors = {true} />
<slot />