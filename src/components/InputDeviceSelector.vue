<template>
  <label for="input-devices">Select input device: </label>
  <select id="input-devices" @change="handleChange">
    <option v-for="device of devices" :key="device.deviceId" :value="device.deviceId">{{ device.label }}</option>
  </select>
</template>

<script setup>
import { ref } from "vue";
const devices = ref([]);
navigator.mediaDevices
  .enumerateDevices()
  .then((info) => devices.value.push(...info.filter(({ kind }) => kind === "audioinput")));
const emit = defineEmits(["select"]);
function handleChange(event) {
  emit("select", event.target.value);
}
</script>

<style scoped></style>
