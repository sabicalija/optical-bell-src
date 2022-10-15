<template>
  <button @click="handleConnect">Connect</button>
  <InputDeviceSelector @select="handleSelect" />
  <Oscilloscope v-if="microphone && audioCtx" :input="microphone" :ctx="audioCtx" />
</template>

<script setup>
import { ref } from "vue";

import InputDeviceSelector from "./components/InputDeviceSelector.vue";
import Oscilloscope from "./components/Oscilloscope.vue";

const audioCtx = ref();
const microphone = ref();

function handleSelect(id) {
  console.log(`Device ${id} selected`);
  setInputDevice(id);
}

function handleConnect() {
  audioCtx.value = new AudioContext();
  setInputDevice("");
}

function setInputDevice(id) {
  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      deviceId: { exact: id },
    })
    .then((stream) => {
      microphone.value = audioCtx.value.createMediaStreamSource(stream);
    });
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
