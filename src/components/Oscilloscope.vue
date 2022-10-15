<template>
  <canvas id="oscilloscope" ref="oscilloscope" width="1000" height="600"></canvas>
</template>

<script setup>
import { createForLoopParams } from "@vue/compiler-core";
import { ref, toRefs, onMounted } from "vue";
const oscilloscope = ref(null);

const props = defineProps({
  input: { type: MediaStreamAudioSourceNode, default: null },
  ctx: { type: AudioContext, default: null },
  state: { type: String, default: "inactive" },
});

const { ctx, input, state } = toRefs(props);

const analyser = ctx.value.createAnalyser();
analyser.fftSize = 2048;
input.value.connect(analyser);
const length = analyser.frequencyBinCount;
const buffer = new Uint8Array(length);
let previousTimestamp = 0;
analyser.getByteTimeDomainData(buffer);

onMounted(() => {
  draw();
});

function draw(timestamp) {
  if (!oscilloscope.value) return;
  requestAnimationFrame(draw);
  const context = oscilloscope.value.getContext("2d");
  analyser.getByteTimeDomainData(buffer);
  context.fillStyle = "rgb(200, 200, 200)";
  context.fillRect(0, 0, oscilloscope.value.width, oscilloscope.value.height);
  context.lineWidth = 2;
  context.strokeStyle = "rgb(0, 0, 0)";
  context.beginPath();
  const sliceWidth = (oscilloscope.value.width * 1.0) / length;
  let x = 0;
  for (let i = 0; i < length; i++) {
    const v = buffer[i] / 128.0;
    const y = (v * oscilloscope.value.height) / 2;
    if (i === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
    x += sliceWidth;
  }
  context.lineTo(oscilloscope.value.width, oscilloscope.value.height / 2);
  context.stroke();
  context.beginPath();
  context.fillStyle = state.value === "recording" ? "red" : "gray";
  context.arc(oscilloscope.value.width * 0.035, oscilloscope.value.height * 0.075 - 7, 8, 0, 2 * Math.PI);
  context.fill();
  context.font = "1.5rem serif";
  context.fillStyle = state.value === "recording" ? "black" : "gray";
  context.fillText("REC", oscilloscope.value.width * 0.05, oscilloscope.value.height * 0.075);
  context.fillStyle = "black";
  context.fillText(
    `${Number(1000 / (timestamp - previousTimestamp)).toFixed(0)} FPS`,
    oscilloscope.value.width * 0.9,
    oscilloscope.value.height * 0.075
  );
  previousTimestamp = timestamp;
}
</script>

<style scoped>
#oscilloscope {
  width: 80%;
}
</style>
