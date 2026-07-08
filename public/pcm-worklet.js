// AudioWorkletProcessor: mono downmix + linear-interpolation resample from
// the AudioContext's native sample rate down to targetSampleRate, then
// Float32 -> Int16 (pcm_s16le) for the Soniox realtime WebSocket.
//
// `sampleRate` below is not a typo/undeclared global — it's provided by the
// AudioWorkletGlobalScope, equal to the owning AudioContext's sample rate.
class PCMWorkletProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const { targetSampleRate = 16000, chunkMs = 100 } = options.processorOptions || {};

    this.step = sampleRate / targetSampleRate;
    this.readPos = 0;
    // Native-rate samples carried from the end of the previous render quantum,
    // needed so interpolation across the 128-sample block boundary has the
    // points it needs instead of glitching at every boundary.
    this.prevTail = new Float32Array(0);

    this.chunkSamples = Math.round(targetSampleRate * (chunkMs / 1000));
    this.outBuffer = new Int16Array(this.chunkSamples);
    this.outIndex = 0;

    // Sent by the main thread right before disconnecting, so the last
    // partial chunk (up to chunkMs of trailing audio) isn't silently
    // dropped — process() only posts once outBuffer is completely full.
    this.port.onmessage = (event) => {
      if (event.data && event.data.type === "flush") this.flush();
    };
  }

  flush() {
    if (this.outIndex === 0) return;
    const partial = this.outBuffer.slice(0, this.outIndex).buffer;
    this.port.postMessage(partial, [partial]);
    this.outBuffer = new Int16Array(this.chunkSamples);
    this.outIndex = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    let mono;
    if (input.length === 1) {
      mono = input[0];
    } else {
      mono = new Float32Array(input[0].length);
      for (let i = 0; i < mono.length; i++) {
        let sum = 0;
        for (let ch = 0; ch < input.length; ch++) sum += input[ch][i];
        mono[i] = sum / input.length;
      }
    }

    const offset = this.prevTail.length;
    const samples = offset ? Float32Array.from([...this.prevTail, ...mono]) : mono;

    let pos = this.readPos + offset;
    while (true) {
      const idx = Math.floor(pos);
      if (idx + 1 >= samples.length) {
        // Not enough lookahead to interpolate the next point — stop here and
        // carry just enough native-rate tail (relative to `step`) forward.
        const tailLen = Math.min(mono.length, Math.ceil(this.step) + 1);
        this.prevTail = mono.slice(mono.length - tailLen);
        this.readPos = (pos - offset) - (mono.length - tailLen);
        break;
      }

      const frac = pos - idx;
      const sample = samples[idx] + (samples[idx + 1] - samples[idx]) * frac;
      const clamped = Math.max(-1, Math.min(1, sample));
      this.outBuffer[this.outIndex++] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;

      if (this.outIndex >= this.chunkSamples) {
        this.port.postMessage(this.outBuffer.buffer, [this.outBuffer.buffer]);
        this.outBuffer = new Int16Array(this.chunkSamples);
        this.outIndex = 0;
      }

      pos += this.step;
    }

    return true;
  }
}

registerProcessor("pcm-worklet", PCMWorkletProcessor);
