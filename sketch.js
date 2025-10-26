let video;
let prevFrame = null;
let streams = [];
let fontSize = 20;
let numCols;
let initialChars = ['1', 'l', 'T', 'f', 't', '7', '!'];
let changedChars = ['0', 'o', 'b', 'c', 'd', 'g', 'q', 'O', 'D', 'B', '6', '8', '@'];
let setBgButton;
let referenceReady = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('monospace');
  textSize(fontSize);
  textAlign(CENTER, CENTER);

  numCols = floor(width / fontSize);

  // Video is small for faster diff
  video = createCapture(VIDEO);
  video.size(numCols, floor(height / fontSize));
  video.hide();

  // Setup streams per column
  for (let i = 0; i < numCols; i++) {
    streams.push(new Stream(i * fontSize, numCols, floor(height / fontSize)));
  }

  setBgButton = createButton('Set Reference Background');
  setBgButton.position(10, 10);
  setBgButton.mousePressed(() => {
    if (video.pixels.length > 0) {
      // Re-capture the background
      prevFrame = new Uint8ClampedArray(video.pixels);
      referenceReady = true;
      setBgButton.hide(); // hide button after setting
    }
  });
}

function draw() {
  // background(0, 180);

  // video.loadPixels();

  // // First frame: set reference, then skip this frame
  // if (!prevFrame && video.pixels.length > 0) {
  //   prevFrame = new Uint8ClampedArray(video.pixels);
  //   return;
  // }
  // if (video.pixels.length === 0 || !prevFrame) return;

  background(0, 180);
  video.loadPixels();

  if (!referenceReady) {
    fill(255);
    text("Set Reference Background with Button", width / 2, height / 2);
    return; // Skip rest until ready
  }

  // For each stream/column
  for (let x = 0; x < streams.length; x++) {
    streams[x].update(video, prevFrame);
    streams[x].show();
  }
}

// Each column of falling symbols
class Stream {
  constructor(x, totalCols, totalRows) {
    this.x = x + fontSize / 2; // center text
    this.symbols = [];
    this.totalRows = totalRows;
    this.initSymbols();
  }
  initSymbols() {
    // Each symbol = 1 row
    for (let i = 0; i < this.totalRows; i++) {
      let y = i * fontSize;
      let iniChar = random(initialChars);
      let chgChar = random(changedChars);
      this.symbols.push(new SymbolChar(this.x, y, iniChar, chgChar));
    }
  }
  update(video, prevFrame) {
    for (let i = 0; i < this.symbols.length; i++) {
      this.symbols[i].fall();
      // Map x (canvas) to video index
      let col = floor(map(this.x, 0, width, 0, video.width));
      let row = floor(map(this.symbols[i].y, 0, height, 0, video.height));
      col = constrain(col, 0, video.width - 1);
      row = constrain(row, 0, video.height - 1);
      let idx = 4 * (row * video.width + col);

      let diff = 0;
      for (let k = 0; k < 3; k++) {
        diff += abs(video.pixels[idx + k] - prevFrame[idx + k]);
      }
      let motion = diff > 90; // 3x30 threshold
      this.symbols[i].state = motion;
    }
  }
  show() {
    for (let s of this.symbols) {
      s.show();
    }
  }
}

// Each individual symbol in the stream
class SymbolChar {
  constructor(x, y, defaultChar, changedChar) {
    this.x = x;
    this.y = y;
    this.speed = random(8, 15);
    this.defaultChar = defaultChar;
    this.changedChar = changedChar;
    this.state = false; // default to not changed
  }
  fall() {
    this.y += this.speed;
    if (this.y > height) {
      this.y = -fontSize;
      // Optionally, randomize new chars on loop
      this.defaultChar = random(initialChars);
      this.changedChar = random(changedChars);
    }
  }
  show() {
    if (this.state) {
      // Changed state: darker matrix green
      fill(0, 100, 20);
    } else {
      // Default: normal matrix green
      fill(0, 255, 70);
    }
    text(this.state ? this.changedChar : this.defaultChar, this.x, this.y);
  }
}