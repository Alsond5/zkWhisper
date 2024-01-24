<script lang="ts">
  import { onMount } from 'svelte'
  import { Mina, PublicKey, PrivateKey } from 'o1js'
  import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
  import workerClient from "$lib/workerClient";

  const state = writable();
  $: state.set({
    client: null as null | workerClient
  })

  setContext("state", state);

  async function timeout(seconds: number): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, seconds * 1000);
    });
  }

  onMount(async () => {
    console.log('Loading web worker...');

    const zkappWorkerClient = new workerClient();
    await timeout(5);

    console.log('Done loading web worker');


    const useProof = false;
    const Local = Mina.LocalBlockchain({ proofsEnabled: useProof });
    Mina.setActiveInstance(Local);
    const { privateKey: deployerKey, publicKey: deployerAccount } = Local.testAccounts[0];
    const { privateKey: senderKey, publicKey: senderAccount } = Local.testAccounts[1];
    // ----------------------------------------------------
    // Create a public/private key pair. The public key is your address and where you deploy the zkApp to
    const zkAppPrivateKey = PrivateKey.random();
    const zkAppAddress = zkAppPrivateKey.toPublicKey();

    console.log("initialize");

    await zkappWorkerClient.loadContract();

    console.log("compile");

    await zkappWorkerClient.compileContract();

    console.log("get pka");

    await zkappWorkerClient.initZkappInstance(zkAppAddress);

    const pka = zkappWorkerClient.getPka();

    console.log(pka)
  })
</script>

<svelte:head>
  <title>Mina zkApp UI</title>
</svelte:head>

<main class="w-full h-full flex flex-col items-center justify-center px-20" style="height: calc(100% - 5rem);">
  <div class="text-center">
    <h1 class="mb-5 text-2xl font-bold leading-none tracking-tight text-[#023047] md:text-3xl lg:text-5xl dark:text-white">Secure and private messaging with <span class="underline underline-offset-3 decoration-8 decoration-[#594AF1]">zk-whisper</span></h1>
    <p class="text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">Here is the most secret and secure way to exchange messages without trusting any system</p>
  </div>
  
  <div class="mt-10 flex items-center justify-center">
    <button type="button" class="inline-flex items-center px-7 py-2.5 text-sm font-medium text-center bg-white text-[#023047] font-bold border-2 border-blue-700 rounded-lg hover:text-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
      <span class="mt-1">Join an existing chat</span>
    </button>
    <a href="/create-room" class="inline-flex items-center px-7 py-2.5 ml-5 text-sm border-2 border-blue-700 font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
      <span class="mt-1">Create a new chat</span>
    </a>
  </div>
</main>