<script lang="ts">
    let message_input: HTMLInputElement;
    
    function send_message(event: Event) {
        event.preventDefault();
        // send message
        message_input.value = ""
    }
</script>

<main class="w-full h-full flex flex-col items-center justify-center px-20" style="height: calc(100% - 5rem);">
    <div class="flex flex-col w-full lg:w-2/3 border rounded-lg" style="min-height: 75%;">
        <div class="flex items-center px-5 flex-none h-10 border-b">
            <h3 class="mt-1">B62qjt...ZupLR2</h3>
        </div>
        <div class="flex flex-col flex-1 p-5">
            <!-- chat template -->      
            <div class="flex items-start gap-2.5">
                <img class="w-8 h-8 rounded-full" src="" alt="">
                <div class="flex flex-col w-full max-w-[320px] leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-e-xl rounded-es-xl dark:bg-gray-700">
                    <div class="flex items-center space-x-2 rtl:space-x-reverse">
                        <span class="text-sm font-semibold text-gray-900 dark:text-white">Bonnie Green</span>
                        <span class="text-sm font-normal text-gray-500 dark:text-gray-400">11:46</span>
                    </div>
                    <p class="text-sm font-normal py-2.5 text-gray-900 dark:text-white">That's awesome. I think our users will really appreciate the improvements.</p>
                    <span class="text-sm font-normal text-gray-500 dark:text-gray-400">Delivered</span>
                </div>
            </div>
            <div class="flex items-start gap-2.5 ml-auto">
                <img class="w-8 h-8 rounded-full" src="" alt="">
                <div class="flex flex-col w-full max-w-[320px] leading-1.5 p-4 border-gray-200 bg-[#023047] rounded-bl-xl rounded-t-xl dark:bg-gray-700">
                    <div class="flex items-center space-x-2 rtl:space-x-reverse">
                        <span class="text-sm font-semibold text-white dark:text-white">Bonnie Green</span>
                        <span class="text-sm font-normal text-gray-300 dark:text-gray-400">11:46</span>
                    </div>
                    <p class="text-sm font-normal py-2.5 text-white dark:text-white">That's awesome. I think our users will really appreciate the improvements.</p>
                    <span class="text-sm font-normal text-gray-300 dark:text-gray-400">Delivered</span>
                </div>
            </div>
        </div>
        <div class="flex items-center flex-none h-12 border-t">
            <form on:submit={send_message} class="w-full h-full flex">
                <input bind:this={message_input} type="text" name="" id="" class="h-12 w-full pt-1 px-5 outline-none border rounded-b-lg">
            </form>
        </div>
    </div>
</main>