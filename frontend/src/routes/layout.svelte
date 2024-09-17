<script>
    import Modal from '../lib/AddGroupModel.svelte';
	import { goto } from "$app/navigation";
	import axios from "axios";
	import { onMount } from "svelte";
	import { customAlert } from '../lib/errorHandler';
	import { toast } from 'svelte-sonner';
	const ApiUrl = import.meta.env.VITE_API_URL + ':' + import.meta.env.VITE_PORT + '/api/v1/auth';

    export let showModal = false;
    let username;
    let password;
    let updatedEmail;
    let usergroups;
    let newUserEmail;
    let newUserPassword;
    let exisitngEmail;
    
    const getUserDetails = async(userid) => {
        try{
            const userDetails = await axios.get(ApiUrl + '/getUserByUsername?username='+userid, {withCredentials: true});
            password = userDetails.data.password;
            updatedEmail = userDetails.data.email;
            usergroups = userDetails.data.user_groups;
            exisitngEmail = updatedEmail;

        } catch (error) {
            console.log(error.response.data.message);
            toast.error(error.response.data.message);
        }
    };

    onMount(async () => {
        try {
            const response = await axios.get(ApiUrl + '/application', {withCredentials: true});
			if (response.status === 401) goto('/login');
            username = response.data.username;
            await getUserDetails(username);
        } catch (error) {
            console.log(error.response.data.message);
            toast.error(error.response.data.message);
            goto('/login');
        }
    });

    async function submitEditProfile(updatedProfile) {
        try {
            const response = await axios.put(ApiUrl + '/updateProfile', updatedProfile, {withCredentials: true});
            getUserDetails(username);
            showModal = false;
            customAlert('Profile Updated successfully .');
        } catch (error) {
            console.log(error.response.data.message);
            toast.error(error.response.data.message);
        }
    };

    function openModel() {
        showModal = true;
        getUserDetails(username);
    };

    async function logout() {
        try {
            await axios.post(ApiUrl + '/logout');
            goto('/login');
        } catch (error) {
            console.log(error.response.data.message);
            toast.error(error.response.data.message);
        }
    };

    function updateEmailandPassword() {
        updatedEmail = newUserEmail;
        password = newUserPassword;
        submitEditProfile({password, "email": updatedEmail});
        newUserEmail = "";
        password = "";
    }
    
</script>

 <main>
  <nav class="NavContainer">
    <div class="NavContentLeft"><slot name="NavContentLeft" /></div>
    <div class="NavContentCenter"><slot name="NavContentCenter" /></div>
    <div class="NavContentRight"  on:click={() => openModel()}><slot name="NavContentRight" /></div>
    <div class="NavContentRightRight"  on:click={() => logout()}><slot name="NavContentRightRight" /></div>
  </nav>

  <!-- Default slot for the main content -->
  <slot></slot>
  
</main>

<Modal bind:showModal on:close={() => (showModal = false)}>
	<h2 slot="header">
    Profile
	</h2>

 <div class="input-container">
    <label for="Username" style="margin-bottom: 10px;">Username:</label>
    <input type="text" id="Username" bind:value={username} disabled class="editable1" />
</div>
 <div class="input-container">
    <label for="current email" style="margin-bottom: 10px;">Current Email:</label>
    <input type="text" id="exisitngEmail" bind:value={exisitngEmail} disabled class="editable1" />
</div>

 <div class="input-container">
    <label for="Email" style="margin-bottom: 10px; margin-right:31px">New Email:</label>
    <input type="text" id="Email" bind:value={newUserEmail} class="editable" placeholder="email" />
</div>
 <div class="input-container">
    <label for="Password" style="margin-bottom: 10px;margin-right:8px">New Password:</label>
    <input type="password" id="Password" bind:value={newUserPassword} class="editable" placeholder="password"/>
</div>
 <div slot="button">
    <button class="modelCloseBtn" on:click={() => updateEmailandPassword()}>SAVE CHANGES</button>
  </div>
</Modal>

<style>
.NavContainer {
    background-color: black;
    color: white;
    height: 80px;
    display: flex;
    align-items: center; /* Vertically center the items */
    font-size: large;
    width: 100%;
    margin-right: 0;
}

.NavContentLeft,
.NavContentRight,
.NavContentRightRight {
    flex: 1;
    text-align: left; /* Align Left content to the left */
    font-weight: bold; /* Optional: Bold text */
}

.NavContentLeft {
    padding-left: 40px;
    padding-right: 0;
}

.NavContentRight {
    text-align: right; /* Align RightRight content to the right */
}

.NavContentRightRight {
    text-align: right; /* Align RightRight content to the right */
    padding-right: 40px;
}

.NavContentCenter {
    flex: 2; /* Center element takes up more space */
    text-align: center; /* Center content horizontally */
}


input {
  margin-bottom: 20px;
  padding: 10px;
  width: 50px;
  box-sizing: border-box;
  border: none;
  outline: none;
  padding: 8px;
  background-color: #C9C9C9; /* Default background color for non-editable inputs */
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

.modelCloseBtn{
  cursor: pointer;
  padding: 5px 10px;
  margin-top: 20px;
  border: none;
  color: white;
  background-color: black;
  width: 150px;
  height: 35px;
}

.editable1 {
    background-color: white; /* Set background to white */
    color: black; /* Optional: Set text color to black for contrast */
    box-sizing: border-box; /* Ensure padding doesn't affect width */
    width: 100%; /* Optional: Make it responsive to container width */
}

</style>