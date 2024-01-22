<script lang="ts">
    import { PublicKey, PrivateKey } from "o1js";
    import workerClient from "$lib/workerClient";

    let public_address: string;
    let contract_address: string;

    async function create_room_handler(event: Event) {
        event.preventDefault();

        let puk: PublicKey
        let zkapp_address: PublicKey

        try {
            puk = PublicKey.fromBase58(public_address);
            zkapp_address = PublicKey.fromBase58(contract_address);
        } catch (error) {
            alert("invalid public address");

            return
        }

        const zkappWorkerClient = new workerClient();

        console.log('Done loading web worker');

        await zkappWorkerClient.setActiveInstanceToBerkeley()

        console.log("initialize");

        await zkappWorkerClient.loadContract();

        console.log("compile");

        await zkappWorkerClient.compileContract();

        console.log("get pka");

        await zkappWorkerClient.initZkappInstance(zkapp_address);

        const pka = zkappWorkerClient.getPka();

        console.log(pka)

        // get room id from api
    }
</script>

<main class="w-full h-full flex flex-col items-center justify-center px-20" style="height: calc(100% - 5rem);"> 
    <div class="text-center">
      <h1 class="mb-5 text-2xl font-bold leading-none tracking-tight text-[#023047] md:text-3xl lg:text-5xl dark:text-white">Create room</h1>
      <p class="text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">the address of the person you will speak to will be kept confidential</p>
    </div>
    
    <form on:submit={create_room_handler} class="max-w-xl w-1/2 mx-auto mt-10">
        <div class="mb-5">
            <label for="contract_address" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Contract address</label>
            <input bind:value={contract_address} type="text" id="contract_address" name="contract_address" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="B62qjt3tC8RoRtrsZiz8yX8rXweUC1hR8wqgy8QMThwMBcdWzZupLR2" required>
        </div>
        <div class="mb-5">
            <label for="address" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Public address</label>
            <input bind:value={public_address} type="text" id="address" name="address" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="B62qjt3tC8RoRtrsZiz8yX8rXweUC1hR8wqgy8QMThwMBcdWzZupLR2" required>
        </div>
        <button type="submit" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Create room</button>
    </form>
  
</main>