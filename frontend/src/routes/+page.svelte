<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
  
  
    let isAuthenticated = false; // Replace with your actual authentication check
  
    onMount(() => {
      setTimeout(() => {
        goto('/login');
      }, 1000); // Delay the redirection by 1 second
    });
  </script>