<template>
  <canvas id="oscilloscope" ref="oscilloscope" width="1000" height="600"></canvas>
  <div class="controls">
    <select v-model="style">
      <option v-for="style of styles" :value="style" :key="style">{{ style }}</option>
    </select>
  </div>
</template>

<script setup>
import { ref, toRefs, onMounted, onBeforeUnmount } from "vue";

const oscilloscope = ref(null);
const styles = ["Time Domain", "Frequency Domain", "OLAF"];
const style = ref("Time Domain");

const props = defineProps({
  input: { type: MediaStreamAudioSourceNode, default: null },
  ctx: { type: AudioContext, default: null },
  state: { type: String, default: "inactive" },
});

const { ctx, input, state } = toRefs(props);

onMounted(() => {
  draw();
});

onBeforeUnmount(() => {
  disconnect();
});

function disconnect() {
  input.value.disconnect(analyser);
}

let analyser,
  length,
  buffer,
  previousTimestamp = 0,
  previousStyle = "";
function draw(timestamp) {
  if (!oscilloscope.value) return;
  requestAnimationFrame(draw);
  const context = oscilloscope.value.getContext("2d");

  context.fillStyle = "rgb(200, 200, 200)";
  context.fillRect(0, 0, oscilloscope.value.width, oscilloscope.value.height);

  if (style.value !== previousStyle) {
    input.value.disconnect();
    if (style.value === "Time Domain" || style.value === "Frequency Domain") {
      analyser = ctx.value.createAnalyser();
      analyser.fftSize = 2048;
      input.value.connect(analyser);
      length = analyser.frequencyBinCount;
      buffer = new Uint8Array(length);
    } else if (style.value === "OLAF") {
      analyser = new AudioWorkletNode(ctx.value, "olaf-noise-processor");
      input.value.connect(analyser);
    }
  }

  if (style.value === "Time Domain") {
    drawTimeDomain(context, analyser, buffer, length);
  } else if (style.value === "Frequency Domain") {
    drawFrequencyDomain(context, analyser, buffer, length);
  } else if (style.value === "OLAF") {
    drawFrequencyDomainWithOlaf(context, analyser, buffer, length);
  }

  drawRecorderState(context);
  drawFPSCounter(context, Number(1000 / (timestamp - previousTimestamp)).toFixed(0));
  previousTimestamp = timestamp;
  previousStyle = style.value;
}

function drawTimeDomain(context, analyser, buffer, length) {
  analyser.getByteTimeDomainData(buffer);
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

function drawFrequencyDomain(context, analyser, buffer, length) {
  analyser.getByteFrequencyData(buffer);
  const barwidth = (oscilloscope.value.width / length) * 2.5;
  let x = 0;
  for (let i = 0; i < length; i++) {
    const barheight = -buffer[i];
    context.fillStyle = "rgb(" + (barheight + 100) + ", 50, 50)";
    context.fillRect(x, oscilloscope.value.height / 2, barwidth, barheight / 2);
    x += barwidth + 1;
  }
}

function drawFrequencyDomainWithOlaf(context, analyser, buffer, length) {
  analyser.getByteFrequencyData(buffer);
  console.log("DUMMY", buffer);
}

function drawRecorderState(context) {
  context.beginPath();
  context.fillStyle = state.value === "recording" ? "red" : "gray";
  context.arc(oscilloscope.value.width * 0.035, oscilloscope.value.height * 0.075 - 7, 8, 0, 2 * Math.PI);
  context.fill();
  context.font = "1.5rem serif";
  context.fillStyle = state.value === "recording" ? "black" : "gray";
  context.fillText("REC", oscilloscope.value.width * 0.05, oscilloscope.value.height * 0.075);
}

function drawFPSCounter(context, fps) {
  context.fillStyle = "black";
  context.fillText(`${fps} FPS`, oscilloscope.value.width * 0.9, oscilloscope.value.height * 0.075);
}
</script>

<style scoped>
#oscilloscope {
  width: 80%;
}
</style>
