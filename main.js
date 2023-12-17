let movement = 0;
let canvas;
let ctx;
let centerWidth;
let centerHeight;
let NUMBER_OF_PARTICLES = 10000;
let MIN_SPEED = 50;
let MAX_SPEED = 100;
let MIN_SIZE = 2;
let MAX_SIZE = 10;
let MIN_STAR_SIZE = 2;
let MAX_STAR_SIZE = 5;
let colors = ["#ffb412", "#ffee00", "#ff4d00", "#ff5e00", "#fffb00", "#856242"];
let redColors = ["#880808", "#AA4A44", "#EE4B2B", "#CC5500", "#D22B2B"];
let starColors = [
  "#9bb0ff",
  "#aabfff",
  "#cad7ff",
  "#f8f7ff",
  "#fff4ea",
  "#ffd2a1",
  "#ffcc6f",
  "#FF2400",
  "#ffbb00",
  "#ff0000",
];
let particleArray = [];
let music;
let canvasElement;
let button = null;
let secondMovementButton;
let thirdMovementButton;
let notes = [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72];
let scales = Tonal.Scale.names();
let synth;
let synth2;
let synth3;
let pattern;
let currentNotes;
let scaleNotes;
let currentScaleNote = 0;
let synths = [];
let currentSynth = 0;
let limiter;
let fadedToBlack;

//setting up timer
const timer = (ms) => new Promise((res) => setTimeout(res, ms));

//Creating DOM elements
var firstMovementButton = document.getElementById("firstMovementButton");
secondMovementButton = firstMovementButton.cloneNode(true);
secondMovementButton.innerHTML = "II. The Universe Is Hot";
thirdMovementButton = firstMovementButton.cloneNode(true);
thirdMovementButton.innerHTML = "III. Stars Form";

//adding listeners
firstMovementButton.addEventListener("click", firstMovement);
secondMovementButton.addEventListener("click", secondMovement);
thirdMovementButton.addEventListener("click", thirdMovement);

//top level movement functions
function firstMovement() {
  movement = 1;
  firstMovementButton.parentNode.removeChild(firstMovementButton);

  instantiateVisuals();
  firstMovementAudio();
}

async function secondMovement() {
  movement = 2;
  secondMovementButton.parentNode.removeChild(secondMovementButton);
  for (let i = 0; i < NUMBER_OF_PARTICLES; i++) {
    let current = particleArray[i];
    current.stop();
    current.draw();
  }
  secondMovementAudio();
}

function thirdMovement() {
  movement = 2.5;
  thirdMovementButton.parentNode.removeChild(thirdMovementButton);

  for (let i = 0; i < particleArray.length; i++) {
    let current = particleArray[i];
    current.newR = 0;
    current.newG = 0;
    current.newB = 0;
  }
}
//audio functions

function firstMovementAudio() {
  limiter = new Tone.Limiter(-1).toDestination();

  synth = new Tone.Synth({
    oscillator: {
      type: "fatsquare",
    },
  }).connect(limiter);

  synths.push(synth);

  synth2 = new Tone.Synth({
    oscillator: {
      type: "fatsquare",
    },
  }).connect(limiter);

  synth2.connect(limiter);

  synths.push(synth2);

  let note = Tonal.Note.fromMidi(notes[getRandomInt(0, notes.length)]);
  let rootNote = Tonal.Note.transpose(note, "-8P");
  let scale = scales[getRandomInt(0, scales.length)];
  scaleNotes = Tonal.Scale.get(note + " " + scale).notes;
  pattern = new Tone.Pattern(
    (time, note) => {
      synth.triggerAttackRelease(note, "32n");
    },
    scaleNotes,
    "random"
  );
  pattern.interval = "32n";
  pattern.start();
  Tone.Transport.start();
  synth2.triggerAttack(rootNote);

  setTimeout(() => {
    document.body.appendChild(secondMovementButton);
  }, 9000);
}

async function secondMovementAudio() {
  setTimeout(() => {
    document.body.appendChild(thirdMovementButton);
  }, 9000);
  pattern.stop();
  synth2.triggerRelease();

  synth3 = new Tone.Synth({
    oscillator: {
      type: "triangle",
    },
  }).connect(limiter);
  synths.push(synth3);

  synths.forEach((changeSynth) => {
    changeSynth.oscillator.type = "triangle";
  });
  while (movement == 2) {
    synths[currentSynth].triggerAttackRelease(
      scaleNotes[currentScaleNote],
      Tone.now() + getRandomInt(1, 2)
    );
    currentSynth += 1;
    currentSynth = currentSynth % synths.length;
    currentScaleNote += getRandomInt(2, 3);
    currentScaleNote = currentScaleNote % scaleNotes.length;
    let randomTime = getRandomInt(2, 3) * 1000;
    await timer(randomTime);
  }
}

async function thirdMovementAudio() {
  for (let i = 0; i < synths.length; i++) {
    synths[i].triggerRelease();
    synths[i].envelope.release = 3;
  }

  synths.forEach((changeSynth) => {
    changeSynth.oscillator.type = "sine";
  });

  while (movement == 3) {
    synths[currentSynth].triggerAttackRelease(
      scaleNotes[currentScaleNote],
      "16n"
    );
    let randomX = canvas.width * Math.random();
    let randomY = canvas.height * Math.random();
    particleArray.push(new Particle(randomX, randomY, null, true));
    particleArray.push(new Particle(randomX, randomY, null, false));
    currentSynth += 1;
    currentSynth = currentSynth % synths.length;
    currentScaleNote = getRandomInt(0, scaleNotes.length);
    let randomTime = getRandomInt(3, 5) * 1000;
    await timer(randomTime);
  }
}
//instantiate visuals

function instantiateVisuals() {
  canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  centerWidth = canvas.width / 2;
  centerHeight = canvas.height / 2;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < NUMBER_OF_PARTICLES; i++) {
    particleArray.push(new Particle(centerWidth, centerHeight, i, false));
  }

  //the actual call to start animation
  animate();
}

//Particle system

class Particle {
  constructor(x, y, num, burst) {
    this.x = x;
    this.y = y;
    this.num = num;
    this.burst = burst;
    this.direction = 1;
    this.recalculateSpeed();
    this.xSpeedFactor = this.vx / getRandomInt(1, 10);
    this.ySpeedFactor = this.vy / getRandomInt(1, 10);
    this.oscillationFactor = 0;
    this.oscillationFactorMax = getRandomInt(1, 5);

    this.chooseColor();
    this.chooseTargetColor();

    let oldColor = this.color.replace(/^#/, "");
    let bigint = parseInt(oldColor, 16);
    this.currentR = (bigint >> 16) & 255;
    this.currentG = (bigint >> 8) & 255;
    this.currentB = bigint & 255;
    this.currentA = 1;

    let newColor = this.targetColor.replace(/^#/, "");
    bigint = parseInt(newColor, 16);
    this.newR = (bigint >> 16) & 255;
    this.newG = (bigint >> 8) & 255;
    this.newB = bigint & 255;
    this.newA = 1;

    if (movement == 1 || movement == 2) {
      this.size = Math.random() * (MAX_SIZE - MIN_SIZE) + MAX_SIZE;
    } else if (movement == 3) {
      this.size = 0.1;
      this.targetSize =
        Math.random() * (MAX_STAR_SIZE - MIN_STAR_SIZE) + MAX_STAR_SIZE;
    }
  }

  chooseColor() {
    if (movement == 1) {
      this.color = colors[getRandomInt(0, colors.length - 1)];
    } else {
      this.color = "#FFFFFF";
    }
  }
  update() {
    if (
      this.y > canvas.height ||
      this.y < 0 ||
      this.x > canvas.width ||
      this.x < 0
    ) {
      this.recenter();
    }
    this.x += this.vx;
    this.y += this.vy;
  }

  stop() {
    this.vx = 0;
    this.vy = 0;
  }

  update2() {
    this.x += this.oscillationFactor * this.xSpeedFactor;
    this.y += this.oscillationFactor * this.ySpeedFactor;
    this.oscillationFactor += 1 * this.direction;
    if (Math.abs(this.oscillationFactor) > this.oscillationFactorMax) {
      this.direction *= -1;
    }
    this.adjustColor();
  }

  update2_5() {
    this.x += this.oscillationFactor * this.xSpeedFactor;
    this.y += this.oscillationFactor * this.ySpeedFactor;
    this.oscillationFactor += 1 * this.direction;
    if (Math.abs(this.oscillationFactor) > this.oscillationFactorMax) {
      this.direction *= -1;
    }
    this.adjustColor();
  }

  update3() {
    if (this.burst == true) {
      this.size += 1;
    } else if (this.size < this.targetSize) {
      this.size *= 1.5;
    }

    this.adjustColor();
  }

  recalculateSpeed() {
    let xSign = Math.round(Math.random()) ? 1 : -1;
    let ySign = Math.round(Math.random()) ? 1 : -1;
    this.vx = (Math.random() * (MIN_SPEED - MAX_SPEED) + MIN_SPEED) * xSign;
    this.vy = (Math.random() * (MIN_SPEED - MAX_SPEED) + MIN_SPEED) * ySign;
  }

  adjustColor() {
    if (this.currentR > this.newR) {
      this.currentR -= 1;
    } else if (this.currentR < this.newR) {
      this.currentR += 1;
    }

    if (this.currentG > this.newG) {
      this.currentG -= 1;
    } else if (this.currentG < this.newG) {
      this.currentG += 1;
    }

    if (this.currentB > this.newB) {
      this.currentB -= 1;
    } else if (this.currentB < this.newB) {
      this.currentB += 1;
    }

    if (this.burst == true && this.currentA > 0) {
      this.currentA -= 0.05;
    }
  }

  recenter() {
    this.x = centerWidth;
    this.y = centerHeight;
    this.recalculateSpeed();
  }

  chooseTargetColor() {
    if (movement == 1 || movement == 2) {
      this.targetColor = redColors[getRandomInt(0, redColors.length - 1)];
    } else if (movement == 3) {
      if (this.burst == true) {
        this.targetColor = "#000000";
      } else {
        this.targetColor = starColors[getRandomInt(0, starColors.length - 1)];
      }
    }
  }

  draw() {
    ctx.fillStyle = `rgba(${this.currentR}, ${this.currentG}, ${this.currentB}, ${this.currentA})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function animate() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.01)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  fadedToBlack = 0;
  for (let i = 0; i < particleArray.length; i++) {
    let current = particleArray[i];
    if (movement == 1) {
      current.update();
    } else if (movement == 2) {
      current.update2();
    } else if (movement == 2.5) {
      current.update2_5();
      if (
        current.currentR == 0 &&
        current.currentG == 0 &&
        current.currentB == 0
      ) {
        fadedToBlack += 1;
      }
    } else {
      current.update3();
    }
    current.draw();
  }

  if (fadedToBlack == NUMBER_OF_PARTICLES) {
    particleArray = [];
    movement = 3;
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    thirdMovementAudio();
  }
  requestAnimationFrame(animate);
}
