<template>
  <canvas ref="oscilloscope"></canvas>
</template>

<script setup>
import { ref, toRefs, onMounted } from "vue";
const oscilloscope = ref(null);

const props = defineProps({
  input: { type: MediaStreamAudioSourceNode, default: null },
  ctx: { type: AudioContext, default: null },
});

const { ctx, input } = toRefs(props);

const analyser = ctx.value.createAnalyser();
analyser.fftSize = 2048;
input.value.connect(analyser);
const length = analyser.frequencyBinCount;
const buffer = new Uint8Array(length);
analyser.getByteTimeDomainData(buffer);

onMounted(() => {
  draw();
});

function draw() {
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
}
</script>

<style scoped></style>
