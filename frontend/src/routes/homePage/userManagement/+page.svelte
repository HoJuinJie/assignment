<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import axios from 'axios';
	import { customAlert } from '../../../lib/errorHandler';
	import Layout from '../../layout.svelte';
	import Modal from '../../../lib/AddGroupModel.svelte';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';
	const ApiUrl = import.meta.env.VITE_API_URL + ':' + import.meta.env.VITE_PORT + '/api/v1/auth';

	let users = [];
	let distinctGroups = [];
	let globalUsername;
	let newGroupName = '';
	let showModal = false;

	let activeStatus = ['ACTIVE', 'DISABLED'];
	let newUser = {
		username: null,
		email: null,
		group: [],
		password: null,
		active: 'ACTIVE',
		editMode: false
	};

	let NewUserSelectedGroup = '';

	// Temp user
	// let updateEmails = [];
	// placeholder={user.email}
	// bind:value={updateEmails[index]}

	let editModeEmails = [];
	let editModePasswords = [];

	const getAllUsers = async () => {
		try {
			const userList = await axios.get(ApiUrl + '/allusers', { withCredentials: true });
			users = userList.data;
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
			const response = await axios.get(ApiUrl + '/userManagement', { withCredentials: true });
			if (response.status === 401) goto('/login');
			globalUsername = response.data.username;
			getAllUsers(); 
			getAllGroups();
		} catch (error) {
			console.log(error.response.data.message);
			toast.error(error.response.data.message);
			if (error.response.status === 401) goto('/login');
		}
	});

	function resetNewUser() {
		newUser = {
			username: null,
			email: null,
			group: [],
			password: null,
			active: 'ACTIVE',
			editMode: false
		};
	}

	function addNewUserGroup() {
		if (!newUser.group.includes(NewUserSelectedGroup)) {
			newUser.group = [...newUser.group, NewUserSelectedGroup];
		}
	}

	function NewUserRemoveGroup(groupIndex) {
		newUser.group = [...newUser.group.slice(0, groupIndex), ...newUser.group.slice(groupIndex + 1)];
	}

	function toggleEditMode(index) {
		users[index].editMode = !users[index].editMode;
	}

	function removeGroup(userIndex, groupIndex) {
		users[userIndex].user_groups = [
			...users[userIndex].user_groups.slice(0, groupIndex),
			...users[userIndex].user_groups.slice(groupIndex + 1)
		];
	}

	function addGroup(index) {
		if (users[index].selectedGroup === '') {
			customAlert('Please select a valid group.');
			return; // Don't allow the default option to proceed
		}

		if (!users[index].user_groups.includes(users[index].selectedGroup)) {
			users[index].user_groups.push(users[index].selectedGroup);
		}
		users[index].showDropdown = false;
	}

	async function saveChanges(index) {
		// console.log(`changes for :${index} | ${updateEmails[index]}`);
		// // check should update
		// if (updateEmails[index] == null) {
		// 	return;
		// }

		users[index].email = editModeEmails[index];
		users[index].password = editModePasswords[index];

		try {
			const response = await axios.patch(ApiUrl + '/adminResetCredentials', users[index], {
				withCredentials: true
			});
			await getAllUsers();
			users[index].editMode = false;
			// updateEmails[index] = null;
			
			customAlert('Saved. Profile update successfully');
		} catch (error) {
			console.log(error.response.data.message);
			toast.error(error.response.data.message);
			if (error.response.status === 401) goto('/login');
		}
		editModeEmails = [];
		editModePasswords = [];
	}

	async function cancelEdit(index) {
		users[index].editMode = false;
		await getAllUsers();
	}

	async function submitNewUser() {
		console.log(newUser);
		try {
			const response = await axios.post(ApiUrl + '/register', newUser, { withCredentials: true });
			await getAllUsers();
			customAlert(`New user: ${newUser.username} created`);
			resetNewUser();
		} catch (error) {
			console.log(error.response.data.message);
			toast.error(error.response.data.message);
		}
	}

	async function addNewGroup() {
		try {
			const response = await axios.post(
				ApiUrl + '/addGroup',
				{ user_group: newGroupName },
				{
					withCredentials: true
				}
			);

			customAlert(`New group: ${newGroupName} created`);
			newGroupName = '';
			await getAllGroups();
		} catch (error) {
			console.log(error.response.data.message);
			toast.error(error.response.data.message);
			if (error.response.status === 401) goto('/login');
		}
	}
</script>

<Layout>
	<span slot="NavContentLeft">Hello, {globalUsername}</span>
	<div slot="NavContentCenter">
		<a
			href="/homePage/application"
			class:active={$page.url.pathname === '/homePage/application'}
			class="links">Application</a
		>
		<a
			href="/homePage/userManagement"
			class:active={$page.url.pathname === '/homePage/userManagement'}
			class="links">User Management</a
		>
	</div>
	<div slot="NavContentRight" class="edit">Edit Profile</div>
	<div slot="NavContentRightRight" class="logout">Logout</div>
</Layout>

<div class="container">
	<div class="header">
		<h1 class="head">User Management</h1>
		<div class="middle"></div>
		<div class="addGroup">
			<button class="AddGroupBtn" on:click={() => (showModal = true)}>ADD GROUP</button>
		</div>
	</div>
	<div class="header-wrapper">
		<div class="header-background"></div>
		<table>
			<thead>
				<tr>
					<th>Username</th>
					<th>Email</th>
					<th>Group</th>
					<th>Password</th>
					<th>Active</th>
					<th>Action</th>
				</tr>
			</thead>
			<tbody class="TableBodyContainer">
				<tr class="input-new">
					<td><input type="text" bind:value={newUser.username} placeholder="enter username" /></td>
					<td><input type="text" bind:value={newUser.email} placeholder="enter email" /></td>
					<td>
						{#each newUser.group as group, groupIndex}
							<span class="tag">
								{group}
								<button class="delete-btn" on:click={() => NewUserRemoveGroup(groupIndex)}>X</button
								>
							</span>
						{/each}
						<select bind:value={NewUserSelectedGroup} on:change={() => addNewUserGroup()}>
							<option value="" disabled>Select Group</option>
							{#each distinctGroups as distinctGroup}
								<option value={distinctGroup}>{distinctGroup}</option>
							{/each}
						</select>
					</td>
					<td
						><input
							type="password"
							bind:value={newUser.password}
							placeholder="enter password"
						/></td
					>
					<td>
						<select bind:value={newUser.active}>
							{#each activeStatus as status}
								<option value={status}>{status}</option>
							{/each}
						</select>
					</td>
					<td>
						<button class="btn-submit" on:click={submitNewUser}>Submit</button>
					</td>
				</tr>

				{#each users as user, index}
					<tr class="userTableBody">
						<td><input type="text" bind:value={user.username} disabled /></td>
						<td
							><input
								type="text"
	
								placeholder={user.email}
								bind:value={editModeEmails[index]}

								disabled={!user.editMode}
								class:editable={user.editMode}
							/></td
						>
						<td>
							{#if user.editMode}
								<div class="tags-container">
									{#each user.user_groups as group, groupIndex}
										<span class="tag">
											{group}
											<button class="delete-btn" on:click={() => removeGroup(index, groupIndex)}
												>X</button
											>
										</span>
									{/each}
									<select bind:value={user.selectedGroup} on:change={() => addGroup(index)}>
										<option value="">Select Group</option>
										{#each distinctGroups as distinctGroup}
											<option value={distinctGroup}>{distinctGroup}</option>
										{/each}
									</select>
								</div>
							{:else}
								<div class="view-only-box">
									{#each user.user_groups as group}
										<span class="tag">{group}</span>
									{/each}
								</div>
							{/if}
						</td>

						<td
							><input
								type="password"

								placeholder={user.password}
								bind:value={editModePasswords[index]}

								disabled={!user.editMode}
								class:editable={user.editMode}
							/></td
						>
						<td>
							<select
								bind:value={user.accountStatus}
								disabled={!user.editMode}
								class:editable={user.editMode}
							>
								{#each activeStatus as status}
									<option value={status}>{status}</option>
								{/each}
							</select>
						</td>
						<td>
							{#if user.editMode}
								<div class="buttons">
									<button class="btn-save" on:click={() => saveChanges(index)}>Save</button> <br />
									<button
										style="margin-top: 10px;"
										class="btn-cancel"
										on:click={() => cancelEdit(index)}>Cancel</button
									>
								</div>
							{:else}
								<button class="btn-edit" on:click={() => toggleEditMode(index)}>Edit</button>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<Modal bind:showModal>
	<h2 slot="header">Add Group</h2>

	<div class="input-container">
		<label for="groupName" style="margin-bottom: 10px;">Group Name:</label>
		<input type="text" id="groupName" bind:value={newGroupName} class="editable" />
	</div>
	<div slot="button">
		<button class="modelAddBtn" on:click={() => addNewGroup()}>ADD</button>
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

	.addGroup {
		flex-grow: 1;
		display: flex;
		justify-content: center;
	}

	.AddGroupBtn {
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

	.header-wrapper {
		position: relative;
		width: 100%;
	}

	/* The background div behind the table header */
	.header-background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%; /* Set the width of the background */
		background-color: #eff4fa;
		height: 90px;
		z-index: -1; /* Put the background behind the header */
	}

	table {
		width: 80%; /* Make table span full width */
		border-collapse: collapse;
		margin-left: auto;
		margin-right: auto;
	}

	thead {
		width: 100%; /* Ensure thead takes full width */
	}

	tbody {
		width: 80%; /* Reduce width of tbody */
		margin-left: auto;
		margin-right: auto;
	}

	td {
		padding: 10px;
		text-align: left;
		border-bottom: 1px solid #ddd;
	}

	th {
		padding: 11px;
		background-color: #eff4fa;
		height: 68px;
		text-align: left;
	}

	.TableBodyContainer {
		margin-left: auto;
		margin-right: auto;
		text-align: center;
	}

	.buttons {
		gap: 10px;
	}

	.btn-save,
	.btn-cancel,
	.btn-submit,
	.btn-edit {
		cursor: pointer;
		padding: 5px 10px;
		border: none;
		color: white;
		background-color: black;
		width: 100%;
	}

	.input-new {
		background-color: #ffffff;
		width: 80%;
		margin-left: auto;
		margin-right: auto;
	}

	input,
	select {
		margin-bottom: 20px;
		padding: 10px;
		width: 100%;
		box-sizing: border-box;
		border: none;
		outline: none;
		padding: 8px;
		background-color: #ffffff; /* Default background color for non-editable inputs */
	}

	.editable {
		background-color: #c9c9c9; /* Background color when editable */
	}

	.view-only-box {
		color: white;
		padding: 10px;
		border-radius: 8px; /* Rounded corners */
		text-align: left;
		display: inline-block;
		width: 100%; /* Make it the same width as the dropdown */
		box-sizing: border-box;
		height: 35px;
	}

	.view-only-box .tag {
		background-color: #d3d3d3;
		margin-right: 5px;
		padding: 3px 6px;
		border-radius: 4px;
	}

	.tags-container {
		display: flex;
		flex-wrap: wrap;
	}

	.tag {
		background-color: #bbb7b7;
		padding: 5px 10px;
		border-radius: 5px;
		margin: 5px;
		display: inline-flex;
		align-items: left;
		color: black;
	}

	.delete-btn {
		background: none;
		border: none;
		margin-left: 5px;
		cursor: pointer;
	}

	.input-container {
		display: flex;
		align-items: center; /* This centers the items vertically */
		justify-content: center;
		gap: 10px; /* Adds space between the label and the input */
	}

	.input-container label {
		margin-right: 5px; /* Optional: add more space between the label and the input */
		white-space: nowrap; /* Keeps the label text on one line */
	}

	.input-container input {
		flex-grow: 1; /* Allows the input to take up any remaining space */
	}

	.modelAddBtn {
		cursor: pointer;
		padding: 5px 10px;
		margin-top: 20px;
		border: none;
		color: white;
		background-color: black;
		width: 150px;
		height: 35px;
	}

	.edit:hover {
		color: lightgray;
	}

	.links {
		font-weight: bold;
	}

	.links:visited {
		color: white;
	}

	.links:hover {
		color: lightgray;
	}
</style>


<!-- NOTES
// PETER's help with onMount
		// await axios
		// 	.get(ApiUrl + '/userManagement', { withCredentials: true })
		// 	.then((response) => {
		// 		if (response.data == null) return;
		// 		globalUsername = response.data.username;
		// 	})
		// 	.catch((e) => {
		// 		if (e instanceof axios.AxiosError) {
		// 			toast.error(`From usermanagement: ${e.response.data.message}`);
		// 			if (e.status == 401) {
		// 				goto('/login');
		// 				return;
		// 			}
		// 		}
		// 		toast.error('ops something went wrong');
		// 	});

		// getAllUsers().catch((e) => console.log(`error in [getAllUsers]: ${e}`));
		// getAllGroups().catch((e) => console.log(`error in [getAllGroups]: ${e}`)); 
-->