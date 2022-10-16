<template>
  <div>
    <InputDeviceSelector @select="handleSelect" />
    <button @click="handleConnect">{{ microphone ? "Disconnect" : "Connect" }}</button>
    <button @click="handleStart">Start</button>
    <button @click="handleStop">Stop</button>
  </div>
  <Oscilloscope v-if="microphone && audioCtx" :input="microphone" :ctx="audioCtx" :state="state" />
  <ul>
    <Recording v-for="(recording, i) of recordings" :key="i" :src="recording.src" />
  </ul>
</template>

<script setup>
import { ref } from "vue";

import InputDeviceSelector from "./components/InputDeviceSelector.vue";
import Oscilloscope from "./components/Oscilloscope.vue";
import Recording from "./components/Recording.vue";

const deviceId = ref("");
const audioCtx = ref();
const state = ref();
const recorder = ref();
const recordings = ref([]);
const microphone = ref();
let chunks = [];

function handleSelect(id) {
  console.log(`Device ${id} selected`);
  setInputDevice(id);
}

function handleConnect() {
  if (!audioCtx.value) {
    audioCtx.value = new AudioContext();
    // FIXME
    // https://stackoverflow.com/questions/65673325/best-way-to-call-wasm-module-functions-in-audioworkletprocessor
    // https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/Module#sending_a_compiled_module_to_a_worker
    // https://developer.chrome.com/blog/audio-worklet-design-pattern/
    audioCtx.value.audioWorklet.addModule("js/olaf.js").then(() => {
      audioCtx.addModule("js/olaf-noise-processor.js").then(() => {
        setInputDevice(deviceId.value);
      });
    });
  } else {
    audioCtx.value.close();
    audioCtx.value = null;
    microphone.value = null;
  }
}

function handleStart() {
  if (!audioCtx.value) return;
  recorder.value.start();
  state.value = recorder.value.state;
}

function handleStop() {
  if (!audioCtx.value) return;
  recorder.value.stop();
  state.value = recorder.value.state;
}

function onDataAvailable(event) {
  chunks.push(event.data);
}

function onStop(event) {
  let blob = new Blob(chunks, { type: "audio/mpeg" });
  chunks = [];
  const src = URL.createObjectURL(blob);
  recordings.value.push({ src });
}

function setInputDevice(id) {
  deviceId.value = id;
  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      deviceId: { exact: id },
    })
    .then((stream) => {
      recorder.value = new MediaRecorder(stream);
      recorder.value.addEventListener("dataavailable", onDataAvailable);
      recorder.value.addEventListener("stop", onStop);
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
