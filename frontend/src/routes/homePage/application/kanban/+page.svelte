<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import axios from 'axios';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';
	import Layout from '../../../navBar.svelte';
	import { appWritable } from '../store';
	import Modal from '../../../../lib/CreateAppModel.svelte';
	import { customAlert } from '../../../../lib/errorHandler';

	let globalUsername;
	let isAdmin = false;
	let isPL = false;
	let showModal = false;
	let plans = [];

	const ApiUrl = import.meta.env.VITE_API_URL + ':' + import.meta.env.VITE_PORT + '/api/v1/auth';
	const ApiUrl_TMS = import.meta.env.VITE_API_URL + ':' + import.meta.env.VITE_PORT + '/api/v1/tms';

	let newPlan = {
		planName: null,
		appAcronym: null,
		startDate: null,
		endDate: null,
		colour: '#000000'
	};

	const getPlans = async () => {
		try {
			const planList = await axios.get(ApiUrl_TMS + '/plans', { withCredentials: true });
			plans = planList.data;
		} catch (error) {
			console.log(error.response.data.message);
			toast.error(error.response.data.message);
			if (error.response.status === 401) goto('/login');
		}
	};

	onMount(async () => {
		console.log('log appwritable:', $appWritable);
		if (!$appWritable) {
			goto('/homePage/application');
			return;
		}
		try {
			const response = await axios.get(ApiUrl + '/application', { withCredentials: true });
			if (response.status === 401) goto('/login');
			console.log('logging response.data', response.data);
			globalUsername = response.data.username;
			isAdmin = response.data.isAdmin;
			isPL = response.data.isPL;
			newPlan.appAcronym = $appWritable.App_Acronym;
			getPlans();
		} catch (error) {
			console.log(error.response.data.message);
			toast.error(error.response.data.message);
			goto('/login');
		}
	});

	function resetNewPlan() {
		newPlan = {
			planName: null,
			appAcronym: null,
			startDate: null,
			endDate: null,
			colour: '#000000'
		};
	}

	async function createNewPlan() {
		console.log(newPlan);
		try {
			const response = await axios.post(ApiUrl_TMS + '/createPlan', newPlan, {
				withCredentials: true
			});
			customAlert(`New plan: ${newPlan.planName} created`);
			resetNewPlan();
		} catch (error) {
			console.log(error.response.data.message);
			toast.error(error.response.data.message);
			if (error.response.status === 401) goto('/login');
		}
	}
</script>

<Layout bind:globalUsername>
	<span slot="NavContentLeft" class="greet">Hello, {globalUsername}</span>
	<div slot="NavContentCenter">
		<a
			href="/homePage/application"
			class:active={$page.url.pathname === '/homePage/application'}
			class="links">Application</a
		>
		{#if isAdmin}
			<a
				href="/homePage/userManagement"
				class:active={$page.url.pathname === '/homePage/userManagement'}
				class="links">User Management</a
			>
		{/if}
	</div>
	<div slot="NavContentRight" class="edit">Edit Profile</div>
	<div slot="NavContentRightRight" class="logout">Logout</div>
</Layout>

<main>
	<div class="container">
		<div class="header">
			<h1 class="head">{$appWritable.App_Acronym}'s Kanban</h1>
			<div class="middle"></div>
			<div class="createPlan">
				<button
					class="createPlanBtn"
					on:click={() => {
						showModal = true;
					}}>CREATE PLAN</button
				>
			</div>
		</div>
		<div class="kanban">
			<div class="kanban-container">Open</div>
			<div class="kanban-container">ToDo</div>
			<div class="kanban-container">Doing</div>
			<div class="kanban-container">Done</div>
			<div class="kanban-container">Closed</div>
		</div>
	</div>
</main>

<Modal bind:showModal>
	<h2 slot="header">Create Plan</h2>
	<div class="input-container">
		<label for="appAcronym" style="margin-bottom: 10px;">App Acronym</label>
		<span id="appAcronym">{$appWritable.App_Acronym}</span>
	</div>
	<div class="input-container">
		<label for="planName" style="margin-bottom: 10px;"
			>Plan MVP Name<span style="color: red;">*</span></label
		>
		<input
			type="text"
			id="planName"
			bind:value={newPlan.planName}
			class="editable"
			placeholder="name"
			required
		/>
	</div>
	<div class="input-container">
		<label for="startDate" style="margin-bottom: 10px;"
			>Start Date<span style="color: red;">*</span></label
		>
		<input type="date" id="startDate" bind:value={newPlan.startDate} class="editable" required />
	</div>
	<div class="input-container">
		<label for="endDate" style="margin-bottom: 10px;"
			>End Date<span style="color: red;">*</span></label
		>
		<input type="date" id="endDate" bind:value={newPlan.endDate} class="editable" required />
	</div>
	<div class="input-container">
		<label for="colour" style="margin-bottom: 10px;">Colour<span style="color: red;">*</span></label
		>
		<div class="color-box">
			<div class="custom-color-display" style="background-color: {newPlan.colour}"></div>
			<input type="color" id="colour" bind:value={newPlan.colour} class="hidden-input" />
		</div>
	</div>
	<div class="input-container">
		<div style="color: red;">*required field</div>
	</div>

	<div slot="button">
		<button class="modelCreateBtn" on:click={() => createNewPlan()}>CONFIRM</button>
	</div>
</Modal>

<style>
	.container {
		margin-top: 45px;
		align-items: stretch;
		justify-content: center;
		margin-left: auto;
		margin-right: auto;
	}

	.header {
		display: flex;
		justify-content: center;
		text-align: center;
	}

	.head {
		flex-grow: 1;
	}

	.middle {
		flex-grow: 4;
	}

	.createPlan {
		flex-grow: 1;
		display: flex;
		justify-content: center;
	}

	.createPlanBtn {
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
		margin: 15px 0 0;
		text-align: center;
		cursor: pointer;
		padding: 0 20px;
		transition: all 0.2s;
		float: right;
		line-height: 40px;
	}

	.modelCreateBtn {
		cursor: pointer;
		padding: 5px 10px;
		margin-top: 20px;
		border: none;
		color: white;
		background-color: black;
		width: 150px;
		height: 35px;
	}

	a {
		color: white;
		padding: 0 70px;
	}

	.greet {
		font-weight: bold; /* Optional: Make it bold */
	}

	.links:hover,
	.edit:hover,
	.logout:hover {
		text-decoration: underline;
		color: lightgray;
	}

	.links {
		font-weight: bold; /* Optional: Make it bold */
		text-decoration: none;
	}

	.links:visited {
		color: white;
	}

	.links:hover {
		color: lightgray;
	}

	.input-container {
		display: flex;
		align-items: center;
		margin-bottom: 15px;
	}

	.input-container label {
		width: 150px; /* Fixed width for labels to align them */
		text-align: left;
		margin-right: 10px;
	}

	.input-container input {
		flex: 1;
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
		box-sizing: border-box;
		width: 100%; /* Ensures inputs and selects take full width */
	}

	.editable {
		width: 100%;
	}

	.color-box {
		flex: 1;
		display: flex;
	}

	.custom-color-display {
		flex: 90;
		border-radius: 5px;
		border: 1px solid #ccc;
	}

	.hidden-input {
		flex:1;
		cursor: pointer;
	}

	.kanban {
		display: flex;
		width: 100%; 
		height: 70vh; 
		box-sizing: border-box; /* Ensure padding and borders are included in the width */
	}

	.kanban-container {
		flex-grow: 1; /* Make each container take up equal space */
		border: 1px solid black;
		padding: 20px; /* Optional: Add some padding inside the containers */
		text-align: center; /* Center the text horizontally */
		box-sizing: border-box; /* Include borders and padding in the width calculation */
		overflow-y: auto; /* In case content overflows */
	}

	/* Optional: Add a bit of spacing between columns */
	.kanban-container:not(:last-child) {
		margin-right: 10px;
	}


</style>
