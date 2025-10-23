<template>
    <div>
        <video id="video" muted autoplay loop controls width="720" height="480"></video>
    </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
let webRtcServer = null
onMounted(()=>{
    webRtcServer = new WebRtcStreamer('video',location.protocol + '//127.0.0.1:8000')
    webRtcServer.connect('rtsp://rtspstream:jNq6GaTTSNlv8N6G_-Xfs@zephyr.rtsp.stream/movie')
})
onUnmounted(()=>{
    webRtcServer.disconnect()
    webRtcServer = null
})
</script>