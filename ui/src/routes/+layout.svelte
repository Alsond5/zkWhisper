<script lang="ts">
    import { onMount } from 'svelte';
  import '../styles/globals.css'

  let accounts;
  let display: string | undefined;

  onMount(async () => {
    accounts = await window.mina.getAccounts();

    if (accounts) {
      // Show first 6 and last 4 characters of user's Mina account.
      display = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
    }
  });

  async function connect_wallet() {
    try {
      // Accounts is an array of string Mina addresses.
      accounts = await window.mina.requestAccounts();

      // Show first 6 and last 4 characters of user's Mina account.
      display = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;

      console.log(display)
    } catch (err) {
      // If the user has a wallet installed but has not created an account, an
      // exception will be thrown. Consider showing "not connected" in your UI.
      console.log(err.message);
    }
  }
</script>

<div class="flex items-center w-full h-20 px-20">
  <div>
    <h1 class="font-semibold text-xl text-[#023047]">zk-whisper</h1>
  </div>
  <div class="ml-auto">
    {#if !display}
      <button on:click={connect_wallet} type="button" class="text-[#023047] bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700">
        <svg aria-hidden="true" class="w-6 h-5 me-2 -ms-1" xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none">
          <rect width="100" height="100" fill="#594AF1"/>
          <path d="M50.0067 18.1C55.6467 18.1 60.5667 19.21 64.7667 21.43C68.9667 23.65 72.2067 26.95 74.4867 31.33C76.8267 35.65 77.9967 40.9 77.9967 47.08V82H66.2967V65.8H33.5367V82H22.0167V47.08C22.0167 40.9 23.1567 35.65 25.4367 31.33C27.7767 26.95 31.0467 23.65 35.2467 21.43C39.4467 19.21 44.3667 18.1 50.0067 18.1ZM66.2967 55.99V46C66.2967 40.18 64.8567 35.8 61.9767 32.86C59.0967 29.86 55.0767 28.36 49.9167 28.36C44.7567 28.36 40.7367 29.86 37.8567 32.86C34.9767 35.8 33.5367 40.18 33.5367 46V55.99H66.2967Z" fill="white"/>
        </svg>
        <span class="mt-1">Connect with Auro</span>
      </button>
    {:else}
      <button type="button" class="text-[#023047] bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700">
        <span class="mt-1">{display}</span>
      </button>
    {/if}
  </div>
</div>

<slot/>