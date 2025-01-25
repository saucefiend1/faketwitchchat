<script lang="ts">
    import { onMount } from "svelte";
    export let msg: String;
    let msgArr: String[];
    let username: String;
    let chat: String;
    let textColor: string;
    const color_arr = [
        "text-red-300",
        "text-red-500",
        "text-red-700",
        "text-green-300",
        "text-green-500",
        "text-green-700",
        "text-purple-300",
        "text-purple-500",
        "text-purple-700",
        "text-blue-300",
        "text-blue-500",
        "text-blue-700",
        "text-amber-300",
        "text-amber-500",
        "text-amber-700",
    ];

    function formatMsg() {
        msgArr = msg.split(":");
        if (msgArr.length >= 2) {
            username = msgArr[0];
            chat = msgArr[1];
        }
    }
    function random(min = 1, max = 9) {
        return Math.floor(Math.random() * max) + min;
    }
    function color_picker(colors: String[]) {
        const indexColor = random(0, colors.length - 1);
        return indexColor;
    }
    onMount(async () => {
        formatMsg();
        if (username == "Famous Streamer") {
            textColor = "text-fuchsia-500";
        } else {
            textColor = color_arr[color_picker(color_arr)];
        }
    });
</script>

<div class="mx-2">
    <span class="{textColor} text-base font-semibold ml-1.5">{username}:</span>
    <span class="text-white text-base mx-1 overflow-auto">{chat}</span>
</div>
