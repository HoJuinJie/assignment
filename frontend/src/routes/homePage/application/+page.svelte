<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import axios from 'axios';
	import Layout from '../../navBar.svelte';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';
	import Modal from '../../../lib/CreateAppModel.svelte';
	import { customAlert } from '../../../lib/errorHandler';
	import ShowApp from '$lib/ShowApp.svelte';
	import EditApp from '$lib/EditApp.svelte';
	import { appWritable } from './store';

	const ApiUrl = import.meta.env.VITE_API_URL + ':' + import.meta.env.VITE_PORT + '/api/v1/auth';
	const ApiUrl_TMS = import.meta.env.VITE_API_URL + ':' + import.meta.env.VITE_PORT + '/api/v1/tms';

	let globalUsername;
	let isAdmin;
	let apps = [];
	let isPL = true;
	let distinctGroups = [];

	let newApp = {
		appAcronym: null,
		rNumber: null,
		appDescription: '',
		startDate: null,
		endDate: null,
		appPermitCreate: '',
		appPermitOpen: '',
		appPermitToDo: '',
		appPermitDoing: '',
		appPermitDone: '',
		editMode: false
	};

	let showModal = false;
	let showEditApp = false;
	let editIndex = null;

	const getAllApps = async () => {
		try {
			const appList = await axios.get(ApiUrl_TMS + '/apps', { withCredentials: true });
			apps = appList.data;
		} catch (error) {
			console.log(error.response.data.message);
			toast.error(error.response.data.message);
			if (error.response.status === 401) goto('/login');
		}
	};

	const getAllGroups = async () => {
		try {
			const groupList = await axios.get(ApiUrl + '/allGroups', { withCredentials: true });
			distinctGroups = groupList.data;
		} catch (error) {
			console.log(error.response.data.message);
			toast.error(error.response.data.message);
			if (error.response.status === 401) goto('/login');
		}
	};

	onMount(async () => {
		try {
			const response = await axios.get(ApiUrl + '/application', { withCredentials: true });
			if (response.status === 401) goto('/login');
			// console.log('logging response.data', response.data); //
			globalUsername = response.data.username;
			isAdmin = response.data.isAdmin;
			isPL = response.data.isPL;
			getAllApps();
			getAllGroups();
		} catch (error) {
			console.log(error.response.data.message);
			toast.error(error.response.data.message);
			goto('/login');
		}
	});

	function resetNewApp() {
		newApp = {
			appAcronym: null,
			rNumber: null,
			appDescription: '',
			startDate: null,
			endDate: null,
			appPermitCreate: '',
			appPermitOpen: '',
			appPermitToDo: '',
			appPermitDoing: '',
			appPermitDone: '',
			editMode: false
		};
	}

	async function createNewApp() {
		try {
			const response = await axios.post(ApiUrl_TMS + '/createApp', newApp, {
				withCredentials: true
			});
			await getAllApps();
			customAlert(`New app: ${newApp.appAcronym} created`);
			resetNewApp();
		} catch (error) {
			console.log(error.response.data.message);
			toast.error(error.response.data.message);
			if (error.response.status === 401) goto('/login');
		}
	}

	async function editApp() {
		try {
			const response = await axios.post(ApiUrl_TMS + '/editApp', newApp, {
				withCredentials: true
			});
			await getAllApps();
			customAlert(`${newApp.appAcronym} edited successfully`);
		} catch (error) {
			console.log(error.response.data.message);
			toast.error(error.response.data.message);
			if (error.response.status === 401) goto('/login');
		}
	}

	function getDateFromEpochEdit(epochTime) {
		const date = new Date(epochTime * 1000);
		// Extract day, month, and year
		const day = date.getDate().toString().padStart(2, '0'); // pad with 0 if needed
		const month = (date.getMonth() + 1).toString().padStart(2, '0'); // months are 0-indexed, so add 1
		const year = date.getFullYear();
		// Format as DD/MM/YYYY
		const formattedDate = `${year}-${month}-${day}`;
		return formattedDate;
	}
</script>

<Layout bind:globalUsername>
	<span slot="NavContentLeft" class="greet">Hello, {globalUsername}</span>
	<div slot="NavContentCenter" class="navCenter">
		<a
			href="/homePage/application"
			class:active={$page.url.pathname === '/homePage/application'}
			class="links application">Application</a
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
			<h1 class="head">Applications</h1>
			<div class="middle"></div>
			<div class="createApp">
				<button
					class="createAppBtn"
					on:click={() => {
						resetNewApp();
						showModal = true;
					}}>+APP</button
				>
			</div>
		</div>

		<div class="app-container">
			{#each apps as app, index}
				<ShowApp
					appDetails={app}
					editApp={isPL
						? () => {
								showEditApp = true;
								editIndex = index;
								newApp.appAcronym = apps[editIndex].App_Acronym;
								newApp.rNumber = apps[editIndex].App_Rnumber;
								newApp.appDescription = apps[editIndex].App_Description;
								newApp.startDate = getDateFromEpochEdit(apps[editIndex].App_startDate);
								newApp.endDate = getDateFromEpochEdit(apps[editIndex].App_endDate);
								newApp.appPermitCreate = apps[editIndex].App_permit_Create;
								newApp.appPermitOpen = apps[editIndex].App_permit_Open;
								newApp.appPermitToDo = apps[editIndex].App_permit_toDoList;
								newApp.appPermitDoing = apps[editIndex].App_permit_Doing;
								newApp.appPermitDone = apps[editIndex].App_permit_Done;

								console.log('showing app:', app);
								console.log('showing application array:', apps);
							}
						: null}
					gotoApp={() => {
						appWritable.set(app);
						goto('/homePage/application/kanban');
					}}
				/>
			{/each}
		</div>
	</div>
</main>

<Modal bind:showModal>
	<h2 slot="header">Create Application</h2>
	<div class="createAppRow">
		<div class="input-container input-left">
			<label for="appAcronym" style="margin-bottom: 10px;"
				>App Acronym<span style="color: red;">*</span></label
			>
			<input
				type="text"
				id="appAcronym"
				bind:value={newApp.appAcronym}
				class="editable"
				placeholder="name"
				required
			/>
		</div>

		<div class="input-container">
			<label for="appRNum" style="margin-bottom: 10px;"
				>App R-Number<span style="color: red;">*</span></label
			>
			<input
				type="text"
				id="appRNum"
				bind:value={newApp.rNumber}
				class="editable"
				placeholder="number"
				required
			/>
		</div>
	</div>

	<div class="createAppRow">
		<div class="createAppColumn input-left">
			<div class="input-container">
				<label for="AppDes" style="margin-bottom: 10px;">App Description</label>
				<textarea
				id="AppDes"
				bind:value={newApp.appDescription}
				class="editable"
				placeholder="description"
				/>
			</div>
		</div>

		<div class="createAppColumn">
			<div class="input-container">
				<label for="startDate" style="margin-bottom: 10px;"
					>Start Date<span style="color: red;">*</span></label
				>
				<input type="date" id="startDate" bind:value={newApp.startDate} class="editable" required />
			</div>

			<div class="input-container">
				<label for="endDate" style="margin-bottom: 10px;"
					>End Date<span style="color: red;">*</span></label
				>
				<input type="date" id="endDate" bind:value={newApp.endDate} class="editable" required />
			</div>

			<div class="input-container">
				<label for="appPermitCreate" style="margin-bottom: 10px;">App Permit Create</label>
				<select class="inputfields" id="appPermitCreate" bind:value={newApp.appPermitCreate}>
					<option value="" disabled>- select group -</option>
					{#each distinctGroups as distinctGroup}
						<option class="options" value={distinctGroup}>{distinctGroup}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<div class="createAppRow">
		<div class="input-container input-left">
			<label for="appPermitOpen" style="margin-bottom: 10px;">App Permit Open</label>
			<select class="inputfields" id="appPermitOpen" bind:value={newApp.appPermitOpen}>
				<option value="" disabled>- select group -</option>
				{#each distinctGroups as distinctGroup}
					<option class="options" value={distinctGroup}>{distinctGroup}</option>
				{/each}
			</select>
		</div>

		<div class="input-container">
			<label for="appPermitToDo" style="margin-bottom: 10px;">App Permit ToDo</label>
			<select class="inputfields" id="appPermitToDo" bind:value={newApp.appPermitToDo}>
				<option value="" disabled>- select group -</option>
				{#each distinctGroups as distinctGroup}
					<option class="options" value={distinctGroup}>{distinctGroup}</option>
				{/each}
			</select>
		</div>
	</div>

	<div class="createAppRow">
		<div class="input-container input-left">
			<label for="appPermitDoing" style="margin-bottom: 10px;">App Permit Doing</label>
			<select class="inputfields" id="appPermitDoing" bind:value={newApp.appPermitDoing}>
				<option value="" disabled>- select group -</option>
				{#each distinctGroups as distinctGroup}
					<option class="options" value={distinctGroup}>{distinctGroup}</option>
				{/each}
			</select>
		</div>

		<div class="input-container">
			<label for="appPermitDone" style="margin-bottom: 10px;">App Permit Done</label>
			<select class="inputfields" id="appPermitDone" bind:value={newApp.appPermitDone}>
				<option value="" disabled>- select group -</option>
				{#each distinctGroups as distinctGroup}
					<option class="options" value={distinctGroup}>{distinctGroup}</option>
				{/each}
			</select>
		</div>
	</div>

	<div class="input-container">
		<div style="color: red;">*required field</div>
	</div>

	<div slot="button">
		<button class="modelCreateBtn" on:click={() => createNewApp()}>CONFIRM</button>
	</div>
</Modal>

<EditApp bind:showEditApp>
	<h2 slot="header">Edit Application</h2>
	{#if apps[editIndex]}
		<!--wait for data to be fetched-->
		<div class="editAppRow">
			<div class="input-container input-left">
				<label for="appAcronymEdit" style="margin-bottom: 10px;">App Acronym</label>
				<span id="appAcronymEdit">
					{apps[editIndex].App_Acronym}
				</span>
			</div>
			<div class="input-container">
				<label for="appRNumEdit" style="margin-bottom: 10px;">App R-Number</label>
				<span id="appAcronymEdit">
					{apps[editIndex].App_Rnumber}
				</span>
			</div>
		</div>

		<div class="editAppRow">
			<div class="editAppColumn input-left">
				<div class="input-container">
					<label for="AppDesEdit" style="margin-bottom: 10px;">App Description</label>
					<textarea
						id="AppDesEdit"
						bind:value={newApp.appDescription}
						class="editable"
						placeholder={apps[editIndex].App_Description}
					/>
				</div>
			</div>

			<div class="editAppColumn">
				<div class="input-container">
					<label for="startDateEdit" style="margin-bottom: 10px;"
						>Start Date<span style="color: red;">*</span></label
					>
					<input
						type="date"
						id="startDateEdit"
						bind:value={newApp.startDate}
						class="editable"
						required
					/>
				</div>

				<div class="input-container">
					<label for="endDateEdit" style="margin-bottom: 10px;"
						>End Date<span style="color: red;">*</span></label
					>
					<input type="date" id="endDateEdit" bind:value={newApp.endDate} class="editable" required />
				</div>
				
				<div class="input-container">
					<label for="appPermitCreateEdit" style="margin-bottom: 10px;">App Permit Create</label>
					<select class="inputfields" id="appPermitCreateEdit" bind:value={newApp.appPermitCreate}>
						<option value="" disabled>- select group -</option>
						{#each distinctGroups as distinctGroup}
							<option class="options" value={distinctGroup}>{distinctGroup}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>

		<div class="editAppRow">
			<div class="input-container input-left">
				<label for="appPermitOpenEdit" style="margin-bottom: 10px;">App Permit Open</label>
				<select class="inputfields" id="appPermitOpenEdit" bind:value={newApp.appPermitOpen}>
					<option value="" disabled>- select group -</option>
					{#each distinctGroups as distinctGroup}
						<option class="options" value={distinctGroup}>{distinctGroup}</option>
					{/each}
				</select>
			</div>

			<div class="input-container">
				<label for="appPermitToDoEdit" style="margin-bottom: 10px;">App Permit ToDo</label>
				<select class="inputfields" id="appPermitToDoEdit" bind:value={newApp.appPermitToDo}>
					<option value="" disabled>- select group -</option>
					{#each distinctGroups as distinctGroup}
						<option class="options" value={distinctGroup}>{distinctGroup}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="editAppRow">
			<div class="input-container input-left">
				<label for="appPermitDoingEdit" style="margin-bottom: 10px;">App Permit Doing</label>
				<select class="inputfields" id="appPermitDoingEdit" bind:value={newApp.appPermitDoing}>
					<option value="" disabled>- select group -</option>
					{#each distinctGroups as distinctGroup}
						<option class="options" value={distinctGroup}>{distinctGroup}</option>
					{/each}
				</select>
			</div>

			<div class="input-container">
				<label for="appPermitDoneEdit" style="margin-bottom: 10px;">App Permit Done</label>
				<select class="inputfields" id="appPermitDoneEdit" bind:value={newApp.appPermitDone}>
					<option value="" disabled>- select group -</option>
					{#each distinctGroups as distinctGroup}
						<option class="options" value={distinctGroup}>{distinctGroup}</option>
					{/each}
				</select>
			</div>
		</div>
	{/if}
	<div class="input-container">
		<div style="color: red;">*required field</div>
	</div>
	<div slot="button">
		<button class="modelCreateBtn" on:click={() => editApp()}>CONFIRM</button>
	</div>
</EditApp>

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

	.createApp {
		flex-grow: 1;
		display: flex;
		justify-content: center;
	}

	.createAppBtn {
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

	.navCenter {
		display: flex;
		justify-content: space-evenly;
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
		padding-left: 0;
		padding-right: 0;
		color: white;
	}

	.links:visited {
		color: white;
	}

	.links:hover {
		color: lightgray;
	}

	.application {
		text-decoration: underline;
	}

	.createAppRow,
	.editAppRow {
		display: flex;
	}

	.createAppColumn,
	.editAppColumn {
		flex: 1;
	}

	.input-left {
		padding-right: 16px;
	}

	.input-container {
		display: flex;
		align-items: center;
		margin-bottom: 15px;
		flex: 1;
	}

	.input-container label {
		width: 150px; /* Fixed width for labels to align them */
		text-align: left;
		margin-right: 10px;
	}

	.input-container input,
	.input-container select,
	.input-container textarea {
		flex: 1;
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
		box-sizing: border-box;
		width: 100%; /* Ensures inputs and selects take full width */
	}

	.input-container textarea {
		height: 150px; /* Make the textarea larger */
		resize: none; /* Allow vertical resizing only */
	}

	.editable {
		width: 100%;
	}

	.inputfields {
		width: 100%;
	}

	.app-container {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
	}
</style>
