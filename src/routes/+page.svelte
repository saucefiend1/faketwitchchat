<script>
    // import { afterUpdate } from "svelte";
    import Chat from "$lib/components/Chat.svelte";

    let recording = $state(false);
    let transcription = "";
    let responseMessage = "";
    let mediaRecorder;
    let audioChunks = [];

    let chatinput = $state("");
    let msg;
    let messageContainer;
    let num_of_msg = 5;
    let chats = $state([]);
    let viewers = $state(100);
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    // Start recording audio
    async function startRecording() {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
        });

        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            if (audioChunks.length > 0) {
                const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
                const formData = new FormData();
                formData.append("audio", audioBlob, "audio.wav");
                let viewcount;

                if (viewers <= 20) {
                    viewcount = "1";
                } else {
                    viewcount = Math.round(viewers / 20).toString();
                }
                formData.append("viewers", viewcount);

                // Send audio to the backend for transcription and ChatGPT response
                const res = await fetch("/api/transcribe", {
                    method: "POST",
                    body: formData,
                });

                const data = await res.json();
                transcription = data.transcription;
                responseMessage = data.response;
                console.log(transcription);
                console.log(responseMessage);
                let msgArr = [];
                if (responseMessage) {
                    msgArr = responseMessage.split("|");
                    for (let i = 0; i < msgArr.length; i++) {
                        chats = [...chats, msgArr[i]];
                        await sleep(1000);
                    }
                }

                // Reset audioChunks after sending
                audioChunks = [];
            }
        };
        recording = true;
        mediaRecorder.start(10000);

        // Set interval to stop and restart recording every 10 seconds (10000 ms)

        setInterval(() => {
            mediaRecorder.stop(); // Stop current recording and trigger onstop
            mediaRecorder.start(); // Immediately start new recording chunk
        }, 10000); // 10 seconds
    }

    // Stop recording
    function stopRecording() {
        if (mediaRecorder) {
            mediaRecorder.stop();
        }
        recording = false;
    }
    async function chatOllama(chatinput) {
        if (chatinput == undefined || chatinput == "") {
            console.log("undefined chat");
        } else {
            chats = [...chats, chatinput];
            const content =
                "Act like twitch chat and create a username seperated by a ':' then give one line response to the following: '" +
                chatinput +
                "'. Write nothing else expect the username and the response.";
            console.log(content);
            let response;
            for (let i = 0; i < num_of_msg; i++) {
                response = "res";
                msg = "msg";
                if (msg.substring(0, 8) == "I cannot") {
                    break;
                }
                chats = [...chats, msg];
                console.log(chats);
            }
        }
    }
    function onKeyDown(e) {
        if (chatinput != undefined && chatinput != "" && e.keyCode == 13) {
            chatOllama(chatinput);
            chatinput = "";
        }
    }
    //   afterUpdate(() => {});
    $effect(() => {
        if (chats && messageContainer) scrollToBottom(messageContainer);
    });
    //$: if (chats && messageContainer) {
    //    scrollToBottom(messageContainer);
    //}
    const scrollToBottom = async (node) => {
        node.scroll({ top: node.scrollHeight, behavior: "smooth" });
    };
</script>

<div class="flex flex-col justify-between h-screen">
    <div
        class="flex bg-[#18181b] h-[50px] border-b border-neutral-800 text-white justify-between place-content-center py-3"
    >
        <div>
            {#if !recording}
                <button onclick={startRecording}>🎤 Start Recording</button>
            {:else}
                <button onclick={stopRecording}>🛑 Stop Recording</button>
            {/if}
        </div>
        <h1 class="font-semibold text-sm">FAKE STREAM CHAT</h1>
        <div class="w-[150px] max-w-sm flex">
            <div class="w-[50px] mr-2">
                <span class="">
                    {viewers.toLocaleString("en", { useGrouping: true })}
                </span>
            </div>
            <div class="mr-1">
                <button
                    id="decreaseButton"
                    onclick={() => {
                        if (viewers > 10000) {
                            viewers -= 10000;
                        } else if (viewers > 1000) {
                            viewers -= 1000;
                        } else if (viewers - 100 > 0) {
                            viewers -= 100;
                        }
                    }}
                    class=" ml-1 rounded bg-slate-800 p-1.5 border border-transparent text-center text-sm text-white transition-all shadow-sm hover:shadow focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                    type="button"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        class="w-4 h-4"
                    >
                        <path
                            d="M3.75 7.25a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Z"
                        />
                    </svg>
                </button>
                <button
                    id="increaseButton"
                    onclick={() => {
                        if (viewers >= 10000) {
                            viewers += 10000;
                        } else if (viewers >= 1000) {
                            viewers += 1000;
                        } else {
                            viewers += 100;
                        }
                    }}
                    class=" mr-1 rounded bg-slate-800 p-1.5 border border-transparent text-center text-sm text-white transition-all shadow-sm hover:shadow focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                    type="button"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        class="w-4 h-4"
                    >
                        <path
                            d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z"
                        />
                    </svg>
                </button>
            </div>
        </div>
    </div>

    <div
        bind:this={messageContainer}
        class="grow bg-[#18181b] smooth-scroll max-h-screen overflow-auto"
    >
        {#each chats as chat}
            <Chat msg={chat} />
        {/each}
    </div>
    <div class="flex-none flex-col bg-[#18181b] h-[89.5px]">
        <div class="mx-3">
            <input
                bind:value={chatinput}
                class="flex w-full h-[34px] rounded-[7px] py-1 px-2"
            />
        </div>
        <div class="flex justify-end mx-3 my-2">
            <button
                onclick={() => chatOllama(chatinput)}
                class="flex rounded-md text-white bg-purple-700 hover:bg-purple-800 font-semibold rounded-sm text-sm px-2.5 py-1.5"
                >Chat
            </button>
        </div>
    </div>
</div>
<svelte:window on:keydown={onKeyDown} />
