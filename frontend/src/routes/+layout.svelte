<script>
	import { Toaster } from 'svelte-sonner';
</script>

<Toaster style="z-index: 12;" />
<Toaster expand={true} richColors = {true} />
<slot />