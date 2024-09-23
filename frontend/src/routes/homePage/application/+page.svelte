<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import axios from 'axios';
	import Layout from '../../navBar.svelte';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';
	import Modal from '../../../lib/CreateAppModel.svelte';
	import { customAlert } from '../../../lib/errorHandler';

	const ApiUrl = import.meta.env.VITE_API_URL + ':' + import.meta.env.VITE_PORT + '/api/v1/auth';
	const ApiUrl_TMS = import.meta.env.VITE_API_URL + ':' + import.meta.env.VITE_PORT + '/api/v1/tms';

	let globalUsername;
	let isAdmin;
	let apps = [];

	let newApp = {
		appAcronym: null,
		rNumber: null,
		appDescription: null,
		startDate: null,
		endDate: null,
		appPermitCreate: "",
		appPermitOpen: "",
		appPermitToDo: "",
		appPermitDoing: "",
		appPermitDone: "",
		editMode: false
	}

	let showModal = false;

	// let newAppAcronym;
	// let newRNumber;
	// let newAppDescription;
	// let newStartDate;
	// let newEndDate;
	// let newAppPermitCreate = "";
	// let newAppPermitOpen = "";
	// let newAppPermitToDo = "";
	// let newAppPermitDoing = "";
	// let newAppPermitDone = "";

	const getAllApps = async() => {
		try {
			const appList = await axios.get(ApiUrl_TMS + '/apps', { withCredentials: true });
			apps = appList.data;
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
			globalUsername = response.data.username;
			isAdmin = response.data.isAdmin;
			getAllApps();
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
			appDescription: null,
			startDate: null,
			endDate: null,
			appPermitCreate: "",
			appPermitOpen: "",
			appPermitToDo: "",
			appPermitDoing: "",
			appPermitDone: "",
			editMode: false
		}
	};

	async function createNewApp() {
		try {
			const response = await axios.post(ApiUrl + '/createApp', newApp, { withCredentials: true });
			await getAllApps();
			customAlert(`New app: ${newApp.appAcronym} created`);
			resetNewApp();
		} catch (error) {
			console.log(error.response.data.message);
			toast.error(error.response.data.message);
			if (error.response.status === 401) goto('/login');
		}
	};


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
      <h1 class="head">Applications</h1>
  		<div class="middle"></div>
      <div class="createApp">
        <button class="createAppBtn" on:click={() => (showModal = true)}>CREATE APP</button>
      </div>
    </div>

	{#each apps as app, index}
		<tr class="appTable">
			<td>
				<input type="text" bind:value={app.App_Acronym} disabled />
				<input type="text" bind:value={app.App_Description} disabled />
				<input type="text" bind:value={app.App_startDate} disabled />
				<input type="text" bind:value={app.App_endDate} disabled />
			</td>

		</tr>
	{/each}

  </div>
</main>

<Modal bind:showModal>
	<h2 slot="header">Create Application</h2>
	<div class="input-container">
		<label for="appAcronym" style="margin-bottom: 10px;">App Acronym</label>
		<input
			type="text"
			id="appAcronym"
			bind:value={newApp.appAcronym}
			class="editable"
			placeholder="Name"
		/>
	</div>
	<div class="input-container">
		<label for="appRNum" style="margin-bottom: 10px;">App R-Number</label>
		<input type="text" id="appRNum" bind:value={newApp.rNumber} class="editable" placeholder="Number" />
	</div>
	<div class="input-container">
		<label for="AppDes" style="margin-bottom: 10px;">App Description</label>
		<textarea
			id="AppDes"
			bind:value={newApp.appDescription}
			class="editable"
			placeholder="Description"
		/>
	</div>
	<div class="input-container">
		<label for="startDate" style="margin-bottom: 10px;">Start Date</label>
		<input
			type="date"
			id="startDate"
			bind:value={newApp.startDate}
			class="editable"
			placeholder="DD/MM/YYYY"
		/>
	</div>
	<div class="input-container">
		<label for="endDate" style="margin-bottom: 10px;">End Date</label>
		<input
			type="date"
			id="endDate"
			bind:value={newApp.endDate}
			class="editable"
			placeholder="DD/MM/YYYY"
		/>
	</div>
	<div class="input-container">
		<label for="appPermitCreate" style="margin-bottom: 10px;">App Permit Create</label>
		<select class="inputfields" id="appPermitCreate" bind:value={newApp.appPermitCreate}>
			<option value="" disabled>- select group -</option>
		</select>
	</div>
	<div class="input-container">
		<label for="appPermitOpen" style="margin-bottom: 10px;">App Permit Open</label>
		<select class="inputfields" id="appPermitOpen" bind:value={newApp.appPermitOpen}>
			<option value="" disabled>- select group -</option>
      
		</select>
	</div>
	<div class="input-container">
		<label for="appPermitToDo" style="margin-bottom: 10px;">App Permit ToDo</label>
		<select class="inputfields" id="appPermitToDo" bind:value={newApp.appPermitToDo}>
			<option value="" disabled>- select group -</option>

		</select>
	</div>
	<div class="input-container">
		<label for="appPermitDoing" style="margin-bottom: 10px;">App Permit Doing</label>
		<select class="inputfields" id="appPermitDoing" bind:value={newApp.appPermitDoing}>
			<option value="" disabled>- select group -</option>

		</select>
	</div>
	<div class="input-container">
		<label for="appPermitDone" style="margin-bottom: 10px;">App Permit Done</label>
		<select class="inputfields" id="appPermitDone" bind:value={newApp.appPermitDone}>
			<option value="" disabled>- select group -</option>

		</select>
	</div>
	<div slot="button">
		<button class="modelCreateBtn" on:click={() => createNewApp()}>CONFIRM</button>
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
		padding: 0 10px;
	}

	a:hover {
		text-decoration: none; /* Underline on hover */
	}

	a.active {
		/* text-decoration: underline; 
  font-weight: bold; 
  color: yellow; */
	}

	.greet {
		font-weight: bold; /* Optional: Make it bold */
	}

	.edit:hover,
	.logout:hover {
		text-decoration: underline;
		color: lightgray;
	}

	.links {
		font-weight: bold; /* Optional: Make it bold */
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

</style>
