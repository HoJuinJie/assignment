<script>
	export let showEditTask; // boolean
	import { Toaster } from 'svelte-sonner';

	let dialog; // HTMLDialogElement

	$: if (dialog && showEditTask) dialog.showModal();
	$: if (dialog && !showEditTask) dialog.close();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={dialog}
	on:close={() => (showEditTask = false)}
	on:click|self={() => dialog.close()}
>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="editContainer" on:click|stopPropagation>
		<slot name="header" />

		<slot />

		<!-- svelte-ignore a11y-autofocus -->
		<div class="input-container">
			<button class="modelCloseBtn" on:click={() => dialog.close()}>CANCEL</button>
			<slot class="buttons" name="button1" />
			<slot class="buttons" name="button2" />
			<slot class="buttons" name="button3" />
		</div>
	</div>
	<Toaster expand={true} richColors={true} />
</dialog>

<style>
	.editContainer {
		text-align: center;
		width: 1200px;
		padding-bottom: 10px;
		
	}

	dialog {
		max-width: 2000px;
		border-radius: 0.2em;
		border: none;
		padding: 0;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.1);
		/* background: transparent */
	}
	dialog > div {
		padding: 1em;
        padding-top: 0;
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	button {
		display: block;
	}

	.modelCloseBtn {
		cursor: pointer;
		padding: 5px 10px;
		margin-top: 0px;
		border: none;
		color: white;
		background-color: black;
		width: 150px;
		height: 35px;
	}

	.input-container {
		display: flex;
		align-items: center; /* This centers the items vertically */
		justify-content: center;
		gap: 10px; /* Adds space between the label and the input */
	}

    .button1 {
        background-color: green;
    }

</style>
