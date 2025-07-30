const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function getNoteFromFrequency(freq) {
  const A4 = 440;
  const noteNumber = 12 * Math.log2(freq / A4) + 69;
  const rounded = Math.round(noteNumber);
  const note = noteStrings[rounded % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return `${note} ${octave}`;
}

async function start() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);
  const data = new Float32Array(analyser.fftSize);

  function detect() {
    analyser.getFloatTimeDomainData(data);
    const freq = autoCorrelate(data, audioCtx.sampleRate);
    const noteDisplay = document.getElementById("note");
    if (freq !== -1) {
      const note = getNoteFromFrequency(freq);
      noteDisplay.innerText = `نت: ${note}`;
    } else {
      noteDisplay.innerText = "نت: --";
    }
    requestAnimationFrame(detect);
  }

  detect();
}

function autoCorrelate(buffer, sampleRate) {
  let SIZE = buffer.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  let r1 = 0, r2 = SIZE - 1, thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  }

  buffer = buffer.slice(r1, r2);
  SIZE = buffer.length;

  let c = new Array(SIZE).fill(0);
  for (let i = 0; i < SIZE; i++)
    for (let j = 0; j < SIZE - i; j++)
      c[i] += buffer[j] * buffer[j + i];

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  if (maxpos === -1) return -1;

  let T0 = maxpos;
  return sampleRate / T0;
}
