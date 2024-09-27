<script>
	// @ts-nocheck

	import { onMount } from 'svelte';

	export let taskDetails;
	export let viewTask;
	export let color;

	function getDateFromEpoch(epochTime) {
		const date = new Date(epochTime * 1000);
		// Extract day, month, and year
		const day = date.getDate().toString().padStart(2, '0'); // pad with 0 if needed
		const month = (date.getMonth() + 1).toString().padStart(2, '0'); // months are 0-indexed, so add 1
		const year = date.getFullYear();
		// Format as DD/MM/YYYY
		const formattedDate = `${day}/${month}/${year}`;
		return formattedDate;
	}

	onMount(() => {
		if (color) {
			const card = document.getElementById(taskDetails.Task_id);
			card.style.borderLeft = `4px solid ${color}`;
		}
	});
</script>

<div
	class="task-card"
	on:click={viewTask}
	id={taskDetails.Task_id}
	role="button"
	tabindex="0"
	aria-label="View selected task"
	on:keydown={(e) => e.key === 'Enter' && viewTask()}
>
	<div class="task-content">
		<div class="taskID">
			{taskDetails.Task_id}
		</div>
		<div class="taskName">
			{taskDetails.Task_name}
		</div>
		<div class="taskOwner">
			{taskDetails.Task_owner}
		</div>
	</div>
</div>

<style>
	.task-card {
		display: flex;
		background-color: white;
		border-radius: 8px;
		padding: 10px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin: 10px 10px;
		height: auto;
		text-align: start;
		border-left: 4px solid;
	}

	.taskID {
		font-weight: bold;
		font-size: 20px;
		margin-bottom: 5px;
	}

	.taskName,
	.taskOwner {
		font-size: 18px;
		margin-bottom: 5px;
	}

	.taskOwner {
		background-color: #0095ff;
		text-align: center;
		color: white;
		border-radius: 10px;
	}
</style>
