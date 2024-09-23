<script>
	import { onMount } from "svelte";

	export let appDetails;
	export let editApp;
	export let gotoApp;

    function getDateFromEpoch(epochTime) {
        console.log('logging epoch time', epochTime);
        const date = new Date(epochTime*1000);
        // Extract day, month, and year
        const day = date.getDate().toString().padStart(2, '0'); // pad with 0 if needed
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // months are 0-indexed, so add 1
        const year = date.getFullYear();
        // Format as DD/MM/YYYY
        const formattedDate = `${day}/${month}/${year}`;
        return formattedDate
    }

    onMount(()=>{
        console.log(appDetails)
    })
</script>

<div
	class="app-card"
	on:click={gotoApp}
	role="button"
	tabindex="0"
	aria-label="Go to app"
	on:keydown={(e) => e.key === 'Enter' && gotoApp()}
>
	<div class="app-content">
		<div class="input-container">
			<div class="titleText">App_Acronym</div>
			<div class="bodyText">
				{appDetails.App_Acronym}
			</div>
		</div>

		<div class="input-container app-description">
			<div class="titleText">App_Description</div>
			<div class="bodyText">
				{appDetails.App_Description}
			</div>
		</div>

		<div class="input-container">
			<div class="titleText">App_startDate</div>
			<div class="bodyText">
				{getDateFromEpoch(appDetails.App_startDate)}
			</div>
		</div>

		<div class="input-container">
			<div class="titleText">App_endDate</div>
			<div class="bodyText">
				{getDateFromEpoch(appDetails.App_endDate)}
			</div>
		</div>
	</div>
	{#if editApp}
		<button class="edit-button" on:click|stopPropagation={editApp}>Edit</button>
	{/if}
</div>

<style>
	.app-card {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		background-color: #e0e0e0;
		border-radius: 8px;
		padding: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		width: 800px;
		margin: 10px 50px;
		height: auto;
	}

	.app-content {
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 10px;
	}

	.input-container {
		display: flex;
	}

	.titleText {
		font-weight: 1000;
		font-size: 15px;
		margin-bottom: 5px;
		color: #333;
		margin-right: 30px;
		width: 100px;
	}

	.bodyText {
		font-size: 16px;
		color: #555;
	}

	.app-description {
		flex-grow: 2;
	}

	/* Set flex-grow for other sections for spacing */
	.input-container:not(.app-description) {
		flex-grow: 1;
	}

	.app-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	/* Responsiveness */
	@media (max-width: 768px) {
		.app-card {
			flex-direction: column;
		}

		.edit-button {
			align-self: flex-end;
		}
	}

	.edit-button {
		width: auto;
		appearance: button;
		background-color: black;
		color: white;
		border-width: 0;
		box-shadow:
			rgba(50, 50, 93, 0.1) 0 0 0 1px inset,
			rgba(50, 50, 93, 0.1) 0 2px 5px 0,
			rgba(0, 0, 0, 0.07) 0 1px 1px 0;
		box-sizing: border-box;
		font-size: 15px;
		height: 40px;
		text-align: center;
		cursor: pointer;
		padding: 0 20px;
		transition: all 0.2s;
		float: right;
		line-height: 40px;
	}
</style>
