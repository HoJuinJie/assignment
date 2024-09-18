<script>
	import { onMount } from "svelte";
  import { goto } from "$app/navigation";
	import axios from "axios";
  import Layout from "../../navBar.svelte";
  import { page } from "$app/stores";
	import { toast } from 'svelte-sonner';
	const ApiUrl = import.meta.env.VITE_API_URL + ':' + import.meta.env.VITE_PORT + '/api/v1/auth';

    let globalUsername;
    let isAdmin;


    onMount(async () => {
        try {
            const response = await axios.get(ApiUrl + '/application', {withCredentials: true});
			      if (response.status === 401) goto('/login');
            globalUsername = response.data.username;
            isAdmin = response.data.isAdmin;
        } catch (error) {
            console.log(error.response.data.message);
            toast.error(error.response.data.message);
            goto('/login');
        }
    })

</script>


<Layout bind:globalUsername>
<span slot="NavContentLeft" class='greet'>Hello, {globalUsername}</span>
  <div slot="NavContentCenter">
    <a href="/homePage/application" class:active={$page.url.pathname === '/homePage/application'} class="links">Application</a>
    {#if isAdmin}
      <a href="/homePage/userManagement" class:active={$page.url.pathname === '/homePage/userManagement'} class="links">User Management</a>
    {/if}
  </div>
  <div slot="NavContentRight" class='edit'>Edit Profile</div>
  <div slot="NavContentRightRight" class="logout">Logout</div>
</Layout>


<main>
    <h1>Applications</h1>
    <p>Applications will be shown here:</p>
</main>


<style>
    a {
  text-decoration: none; /* Remove the default underline */
  color: white;
  padding: 0 10px;
}

a:hover {
  text-decoration: underline; /* Underline on hover */
}

a.active {
  text-decoration: underline; /* Underline if this is the active page */
  font-weight: bold; /* Optional: Make it bold */
  /* color: yellow; */
}

.greet {
    font-weight: bold; /* Optional: Make it bold */

}

.edit:hover,
.logout:hover {
  color: lightgray;
}

.links {
  text-decoration: underline; /* Underline if this is the active page */
  font-weight: bold; /* Optional: Make it bold */
}

.links:visited {
  color: white;
}

.links:hover {
  color: lightgray;
}
</style>