<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import axios from 'axios';
	import Layout from '../../../navBar.svelte';
	import { page } from '$app/stores';
	import { getContext } from 'svelte';

	const ApiUrl = import.meta.env.VITE_API_URL + ':' + import.meta.env.VITE_PORT + '/api/v1/auth';

	const appWritable = getContext('appStore');

	let globalUsername;
	let isAdmin = false;
	let isPL = false;

	onMount(async () => {
		// appWritable.subscribe((changes) => {
		// 	console.log(`chnages in my app values: ${JSON.stringify(changes)}`);
		// });
		try {
			const response = await axios.get(ApiUrl + '/application', { withCredentials: true });
			if (response.status === 401) goto('/login');
			globalUsername = response.data.username;
			isAdmin = response.data.isAdmin;
			isPL = response.data.isPL;
		} catch (error) {
			console.log(error.response.data.message);
			toast.error(error.response.data.message);
			goto('/login');
		}
	});
</script>

<h1>
	{$appWritable.App_Acronym}
</h1>
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
