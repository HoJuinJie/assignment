<script>
    import {goto} from '$app/navigation'
    import axios from 'axios'
	  import { toast } from 'svelte-sonner';

 
    let username ='';
    let password ='';
    const ApiUrl = import.meta.env.VITE_API_URL+':'+import.meta.env.VITE_PORT+'/api/v1/auth';

    const login = async() =>{  
        try {
          await axios.post(ApiUrl+'/login', {
            username,
            password,
          }, {withCredentials: true});
          goto('/homePage/application');
        } catch (error) {
          console.log(error.response.data.message);
          toast.error(error.response.data.message);
        }
    };
</script>


<div class="loginFormContainer">
    <div>
    <h1>LOGIN</h1>
    <form class="loginForm" on:submit|preventDefault={login}>
        <input type="text" placeholder="Username" bind:value={username}/> <br> 
        <input type="password" placeholder="Password" bind:value={password}/> <br>
        <button class="loginSubmitBtn" type="submit"> LOGIN </button>
    </form>
    </div>
</div>


<style>
/* Center the form elements inside the form */
.loginFormContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin-top: 10%;
}

.loginFormContainer h1{
  text-align: center;
  margin-bottom: 30px;
}


.loginForm input {
  margin-bottom: 20px;
  padding: 10px;
  width: 100%;
  box-sizing: border-box;
  border: none; 
  outline: none; 
  padding: 8px; 
  background-color: transparent; 
  color: #000; 
  font-size: 16px; 
  background-color: #C9C9C9;
}

.loginFormContainer > div {
  justify-content: center;
  padding: 20px;
  background-color: white; 
  /* box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); */
  border-radius: 8px; 
  width: 450px; 
}



/* CSS */
.loginSubmitBtn {
  appearance: button;
  backface-visibility: hidden;
  background-color: #405cf5;
  background-color: black;
  color: white;
  /* border-radius: 6px; */
  border-width: 0;
  box-shadow: rgba(50, 50, 93, .1) 0 0 0 1px inset,rgba(50, 50, 93, .1) 0 2px 5px 0,rgba(0, 0, 0, .07) 0 1px 1px 0;
  box-sizing: border-box;
  color: #fff;
  cursor: pointer;
  font-family: -apple-system,system-ui,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif;
  font-size: 100%;
  height: 44px;
  line-height: 1.15;
  margin: 12px 0 0;
  outline: none;
  overflow: hidden;
  padding: 0 25px;
  position: relative;
  text-align: center;
  text-transform: none;
  transform: translateZ(0);
  transition: all .2s,box-shadow .08s ease-in;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  width: 100%;
  float: right;
}

.loginSubmitBtn:disabled {
  cursor: default;
}

.loginSubmitBtn:focus {
  box-shadow: rgba(50, 50, 93, .1) 0 0 0 1px inset, rgba(50, 50, 93, .2) 0 6px 15px 0, rgba(0, 0, 0, .1) 0 2px 2px 0, rgba(50, 151, 211, .3) 0 0 0 4px;
}
.loginSubmitBtn:hover {
  color: lightgray;
}
</style>

<!--
?preventDefault
Default behavior causes a full-page reload, which interrupts the current state of the application and breaks any dynamic, client-side functionality you have in place.

Don't want the browser to reload or navigate away from the page when the form is submitted. 
Instead, you want to handle the form submission entirely on the client side

If you didn't use preventDefault, the form would trigger a full-page reload, even if you handle the submission with JavaScript. 
The page would refresh, your API request might not be completed, and any data bound to variables in Svelte would be lost.
-->