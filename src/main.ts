import "./style.css";

// Handles basic functionality of drawing
class MarkerLine {
  private points: Array<[number, number] | null>;
  private lineWidth: number;
  private color: string;

  constructor(
    startX: number,
    startY: number,
    lineWidth: number = CONFIG.lineWidths.thin,
    color: string = CONFIG.starterColor
  ) {
    this.points = [[startX, startY]];
    this.lineWidth = lineWidth;
    this.color = color;
  }

  public drag(x: number, y: number) {
    // Points in a list for undo function popping
    this.points.push([x, y]);
  }

  public display(ctx: CanvasRenderingContext2D) {
    if (this.points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.lineWidth;
      let isNewStroke = true;
      for (const point of this.points) {
        if (point === null) {
          isNewStroke = true;
        } else {
          const [x, y] = point;
          if (isNewStroke) {
            ctx.moveTo(x, y);
            isNewStroke = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
      ctx.closePath();
    }
  }
}

// Used for color/rotation for both strickers and general tool classes
class DrawFig {
  protected color: string;
  protected rotation: number;

  constructor(color: string = CONFIG.starterColor, rotation: number = 0) {
    this.color = color;
    this.rotation = rotation;
  }
  setRotation(angle: number) {
    this.rotation = angle; // Update rotation angle
  }

  setColor(color: string) {
    this.color = color; // updates color
  }
}

// defaults for canvas in one area (easier to change later)
const CONFIG = {
  font: "40px serif",
  starterColor: "black",
  lineWidths: { thin: 1, thick: 3 },
};

// The class takes in the size of the line, and the x and y position of the cursor
// It uses the update method to track their recent position, while draw focuses on creating a circle to follow the cursor
class ToolPreview extends DrawFig {
  // extending from function used in DrawFig
  private x: number = 0;
  private y: number = 0;
  private size: number;
  private sticker: string | null = null;

  constructor(size: number, sticker: string | null = null, color: string) {
    super(color);
    this.size = size;
    this.sticker = sticker;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.sticker) {
      ctx.save();

      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      ctx.font = CONFIG.font; // Set the font size to match StickerCommand
      ctx.fillStyle = this.color;

      const textWidth = ctx.measureText(this.sticker).width;
      ctx.fillText(this.sticker, -textWidth / 2, this.size / 4);

      ctx.restore();
    } else {
      // Circle preview for drawing mode
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = CONFIG.lineWidths.thin;
      ctx.stroke();
      ctx.closePath();
    }
  }
}

class StickerCommand extends DrawFig {
  // extending from function used in DrawFig
  private x: number;
  private y: number;
  sticker: string;

  constructor(
    x: number,
    y: number,
    sticker: string,
    color: string = CONFIG.starterColor,
    rotation: number
  ) {
    super(color, rotation);
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }

  public place(
    x: number,
    y: number,
    points: Array<MarkerLine | StickerCommand | null>
  ) {
    this.x = x;
    this.y = y;
    points.push(
      new StickerCommand(x, y, this.sticker, this.color, this.rotation)
    );
  }
  public display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.font = CONFIG.font;
    ctx.fillStyle = this.color;
    ctx.fillText(this.sticker, 0, 0);
    ctx.restore();
  }
}

// Name and board added to the webpage
const APP_NAME = "Canvas Crafter 🎨";
const app = document.querySelector<HTMLDivElement>("#app")!;
const header = document.createElement("h1");
header.innerText = APP_NAME;
app.appendChild(header);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.appendChild(canvas);

const board = canvas.getContext("2d")!;
board.fillStyle = "#FFFFFF";
board.fillRect(0, 0, canvas.width, canvas.height);

let isDrawing = false;
let currentLineWidth = CONFIG.lineWidths.thin;

const colorLabel = document.createElement("label");
colorLabel.innerText = "Color";
colorLabel.htmlFor = "colorSlider";
app.append(colorLabel);

const colorSlider = document.createElement("input");
colorSlider.id = "colorSlider"; // Add id for label reference
colorSlider.type = "range";
colorSlider.min = "0";
colorSlider.max = "360";
colorSlider.value = "0";
colorSlider.style.width = "100px";
colorSlider.style.background =
  "linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)";

let currentLineColor = `hsl(${colorSlider.value}, 100%, 50%)`;
colorSlider.addEventListener("input", () => {
  currentLineColor = `hsl(${colorSlider.value}, 100%, 50%)`;
  toolPreview.setColor(currentLineColor);
  currentSticker?.setColor(currentLineColor);
  toolMovedEvent();
});
app.append(colorSlider);

const rotationLabel = document.createElement("label");
rotationLabel.innerText = "Rotation";
rotationLabel.htmlFor = "rotationSlider";
app.append(rotationLabel);

// Brace helped write parts of these variables

let currentLine: MarkerLine | null = null; // this is the current line being drawn (set to null in the beginning)
let toolPreview: ToolPreview = new ToolPreview(
  currentLineWidth * 5,
  null,
  currentLineColor
); // Used for the circle under the cursor
let currentSticker: StickerCommand | null = null; // used to hold stickers
let isStickerActive = false;

const points: Array<MarkerLine | StickerCommand | null> = []; // array to hold new points (holds all Markerline information)
const redoStack: Array<MarkerLine | StickerCommand | null> = []; // array used to hold previous points (used for undo/redo)

const emojiRow = document.createElement("div");
const customStickerRow = document.createElement("div");
const actionButtonRow = document.createElement("div");
const lineButtonRow = document.createElement("div");

app.append(emojiRow, customStickerRow, actionButtonRow);

function clearStickerMode() {
  isStickerActive = false;
  currentSticker = null;
  toolPreview = new ToolPreview(currentLineWidth * 5, null, currentLineColor); // Reset to line preview
}

canvas.addEventListener("mousedown", (e) => {
  const x = e.offsetX;
  const y = e.offsetY;
  if (!isStickerActive) {
    isDrawing = true;
    currentLine = new MarkerLine(x, y, currentLineWidth, currentLineColor); // Use current color
    points.push(currentLine);
  } else if (isStickerActive && currentSticker) {
    currentSticker.place(x, y, points);
    drawingChangedEvent();
  }
  redoStack.length = 0;
});

canvas.addEventListener("mousemove", (e) => {
  const x = e.offsetX;
  const y = e.offsetY;
  toolPreview.updatePosition(x, y);
  if (isDrawing && currentLine) {
    currentLine.drag(x, y); // circle follows this line
    toolMovedEvent(); // another section of code handles the original else if logic
  }
  redrawCanvas();
});

canvas.addEventListener("mouseup", () => {
  if (isDrawing) {
    isDrawing = false;
    currentLine = null;
    drawingChangedEvent(); // Added for performance improvements
  }
});

canvas.addEventListener("mouseleave", () => {
  toolPreview.updatePosition(-100, -100); // Move off-canvas
  redrawCanvas();
});

function drawingChangedEvent() {
  const event = new Event("drawing-changed");
  canvas.dispatchEvent(event);
}

// Helper function (created with the use of Brace) to help redraw the canvas and existing lines
function redrawCanvas() {
  board.clearRect(0, 0, canvas.width, canvas.height);
  board.fillStyle = "#FFFFFF";
  board.fillRect(0, 0, canvas.width, canvas.height);
  for (const point of points) {
    if (point !== null) {
      point.display(board);
    }
  }
  toolPreview.draw(board);
}

canvas.addEventListener("drawing-changed", () => {
  redrawCanvas();
});

canvas.addEventListener("tool-moved", () => {
  if (toolPreview) {
    redrawCanvas();
    toolPreview.draw(board);
  }
});

function toolMovedEvent() {
  const event = new Event("tool-moved");
  canvas.dispatchEvent(event);
}

// Buttons used for the emojis
const buttonIds = ["🐶", "🐷", "🐣"];
buttonIds.forEach((emoji) => {
  const buttonElement = document.createElement("button");
  buttonElement.className = "emoji-button"; // Assign a class for styling
  buttonElement.innerText = emoji;
  buttonElement.addEventListener("click", () => handleButtonClick(emoji));
  emojiRow.append(buttonElement);
});

// Function to handle sticker activation
function handleButtonClick(stickerContent: string) {
  toolPreview = new ToolPreview(40, stickerContent, currentLineColor);
  const rotationAngle = parseInt(rotationSlider.value);
  currentSticker = new StickerCommand(
    0,
    0,
    stickerContent,
    currentLineColor,
    rotationAngle
  );
  isStickerActive = true;
  redrawCanvas();
}

// Function to create a sticker button
function createStickerButton(stickerContent: string) {
  const buttonElement = document.createElement("button");
  buttonElement.innerText = stickerContent;
  buttonElement.addEventListener("click", () =>
    handleButtonClick(stickerContent)
  );
  customStickerRow.append(buttonElement);
}

// Button to prompt for a custom sticker
const customStickerButton = document.createElement("button");
customStickerButton.innerText = "Custom Sticker";
customStickerButton.addEventListener("click", () => {
  const customSticker = prompt("Enter a custom sticker or text:", "✨");
  if (customSticker && customSticker.trim()) {
    createStickerButton(customSticker);
    handleButtonClick(customSticker);
  }
});
customStickerRow.append(customStickerButton);

const undoAllButton = document.createElement("button");
undoAllButton.innerHTML = "Undo All Edits";
undoAllButton.style.margin = "1px";
undoAllButton.onclick = () => {
  board.clearRect(0, 0, canvas.width, canvas.height);
  board.fillStyle = "#FFFFFF";
  board.fillRect(0, 0, canvas.width, canvas.height);

  points.length = 0; // clear the array
};

const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo Edits";
undoButton.style.margin = "1px";
undoButton.onclick = () => {
  if (points.length > 0) {
    const lastPoint = points.pop(); // pops last member to take it off the screen
    if (lastPoint !== undefined) {
      redoStack.push(lastPoint);
    }
    drawingChangedEvent(); // Ensure canvas is redrawn after undo
  }
};

const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo Edits";
redoButton.style.margin = "1px";
redoButton.onclick = () => {
  if (redoStack.length > 0) {
    const lastRedo = redoStack.pop(); // pops last memeber off the stack for use
    if (lastRedo !== undefined) {
      points.push(lastRedo);
    }
    drawingChangedEvent(); // Ensure canvas is redrawn after redo
  }
};

const thinLineButton = document.createElement("button");
thinLineButton.innerHTML = "Thin";
thinLineButton.onclick = () => {
  clearStickerMode();
  currentLineWidth = CONFIG.lineWidths.thin;
  toolPreview = new ToolPreview(currentLineWidth * 5, null, currentLineColor);
};

const thickLineButton = document.createElement("button");
thickLineButton.innerHTML = "Thick";
thickLineButton.onclick = () => {
  clearStickerMode();
  currentLineWidth = CONFIG.lineWidths.thick;
  toolPreview = new ToolPreview(currentLineWidth * 5, null, currentLineColor);
};

const exportButton = document.createElement("button");
exportButton.innerText = "Export";
exportButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d")!;

  exportCtx.scale(4, 4);
  exportCtx.fillStyle = "#FFFFFF";
  exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  // Add all points in the array to be exported (keep the board as-is)
  for (const point of points) {
    if (point !== null) {
      point.display(exportCtx);
    }
  }

  exportCanvas.toBlob((blob) => {
    // toBlob creates a url to download the canvas
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; // a/href make to possible to download and covert to a png
      a.download = "canvas_crafter.png";
      a.click();
      URL.revokeObjectURL(url);
    }
  });
});

// logic created/written by ChatGPT
// I entered some intial code about the color slider and inputted it into the program
// It gave me this section of code (that was refined after some questions about how my code worked in general)

const rotationSlider = document.createElement("input");
rotationSlider.type = "range";
rotationSlider.min = "0";
rotationSlider.max = "360";
rotationSlider.value = "0";
rotationSlider.style.width = "100px";
rotationSlider.addEventListener("input", () => {
  const angle = parseInt(rotationSlider.value, 10) * (Math.PI / 180); // Convert to radians
  if (currentSticker) {
    currentSticker.setRotation(angle);
    toolPreview = new ToolPreview(40, currentSticker.sticker, currentLineColor); // Update preview rotation
  }
  toolPreview.setRotation(angle);
  redrawCanvas();
});
app.append(rotationSlider);

actionButtonRow.append(undoAllButton, undoButton, redoButton);
lineButtonRow.append(thinLineButton, thickLineButton, exportButton);

app.append(emojiRow, customStickerRow, actionButtonRow, lineButtonRow);
