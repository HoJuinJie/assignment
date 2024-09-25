<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import axios from 'axios';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';
	import Layout from '../../../navBar.svelte';
	import { appWritable } from '../store';
	import Modal from '../../../../lib/CreateAppModel.svelte';
	import { customAlert } from '../../../../lib/errorHandler'

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
	}

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
		}
	};

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
			<h1 class="head">Task Management Board: {$appWritable.App_Acronym}</h1>
			<div class="middle"></div>
			<div class="createApp">
				<button
					class="createAppBtn"
					on:click={() => {
						showModal = true;
					}}>CREATE PLAN</button
				>
			</div>
		</div>
	</div>
</main>

<Modal bind:showModal>
	<h2 slot="header">Create Plan</h2>
	<div class="input-container">
		<label for="appAcronym" style="margin-bottom: 10px;"
			>App Acronym</label
		>
		<span id="appAcronym">{$appWritable.App_Acronym}</span>
	</div>
	<div class="input-container">
		<label for="planName" style="margin-bottom: 10px;"
			>Plan MVP Name<span style="color: red;">*</span></label
		>
		<input type="text" id="planName" bind:value={newPlan.planName} class="editable" placeholder="name" required />
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
		<label for="colour" style="margin-bottom: 10px;">Colour<span style="color: red;">*</span></label>
		<input type="color" id="colour" bind:value={newPlan.colour}>

	</div>
	<div class="input-container">
		<div style="color: red;">*required field</div>
	</div>

	<div slot="button">
		<button class="modelCreateBtn" on:click={() => createNewPlan()}>CONFIRM</button>
	</div>
</Modal>

<style>
	.links {
		font-weight: bold; /* Optional: Make it bold */
	}

	.links:visited {
		color: white;
	}

	.links:hover {
		color: lightgray;
	}
</style>
