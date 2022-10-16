let audioInputPtr = null;
let fingerprintPtr = null;

let audioBlockIndex = 0;
const js_wrapped_olaf_fingerprint_match = Module.cwrap("olaf_fingerprint_match", "number", ["number", "number"]);

const frequencyData = [];
const fingerprintData = [];
const fingerprintsToPlot = [];

class OLAFNoiseProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const audioInputBuffer = inputs[0];

    const audioInputBytes = audioInputBuffer.length * audioInputBuffer.BYTES_PER_ELEMENT;
    if (audioInputPtr === null) {
      audioInputPtr = Module._malloc(audioInputBytes);
    }

    const fingerprintBytes = 256 * 8 * 5;
    if (fingerprintPtr === null) {
      // 256 fingerprints, 8 bytes long, 5 longs per print
      fingerprintPtr = Module._malloc(fingerprintBytes);
    }
    const fingerprintBuffer = new Uint8Array(fingerprintBytes);

    // Copy data to Emscripten heap (directly accessed from Module.HEAPU8)
    const audioInputHeap = new Uint8Array(Module.HEAPU8.buffer, audioInputPtr, audioInputBytes);
    audioInputHeap.set(new Uint8Array(audioInputBuffer.buffer));

    const fingerprintHeap = new Uint8Array(Module.HEAPU8.buffer, fingerprintPtr, fingerprintBytes);
    fingerprintHeap.set(new Uint8Array(fingerprintBuffer));

    audioBlockIndex = js_wrapped_olaf_fingerprint_match(audioInputHeap.byteOffset, fingerprintHeap.byteOffset);

    // Retrieve the frequency domain data
    const audioInputData = new Float32Array(Module.HEAPF32.buffer, audioInputPtr, audioInputBuffer.length);
    frequencyData.push([audioInputData, audioBlockIndex, false]);
    if (frequencyData.length > 100) {
      frequencyData.shift();
    }

    // Retrieve the fingerprint data
    fingerprintData = new Uint32Array(Module.HEAPU32.buffer, fingerprintPtr, 256 * 6);
    let t1 = fingerprintData[0];
    for (const i = 0; t1 != 0 && i < 256 * 6; i += 6) {
      const f1 = fingerprintData[i + 1];
      const t2 = fingerprintData[i + 2];
      const f2 = fingerprintData[i + 3];
      const fhash = fingerPrintData[i + 4];
      const inDb = fingerPrintData[i + 5];

      fingerprintsToPlot.push([t1, f1, t2, f2, fhash, inDb]);

      t1 = fingerprintData[i + 6];
    }

    return true;
  }

  // getByteFrequencyData(buffer) {
  //   buffer[0] = 1234;
  // }
}
registerProcessor("olaf-noise-processor", OLAFNoiseProcessor);
