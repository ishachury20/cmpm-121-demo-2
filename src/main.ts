import "./style.css";

const APP_NAME = "Hello Dino!";
const app = document.querySelector<HTMLDivElement>("#app")!;

// document.title = APP_NAME;
// app.innerHTML = APP_NAME;

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
let x = 0;
let y = 0;

// Used ChatGPT To generate the points array 
// Prompt to ChatGPT: what is the syntax for creating an array that holds two numbers in typescript
// Note: I had to show it my previous code to refine the answers it gave me  

// Use a single array to track all points. A null value indicates the end of a stroke.
const points: Array<[number, number] | null> = [];

// Start drawing on mousedown
canvas.addEventListener("mousedown", (e) => {
  x = e.offsetX;
  y = e.offsetY;
  isDrawing = true;
  points.push([x, y]); 
  drawingChangedEvent();
  console.log('Array:', points); 
});

// Track mouse movement while drawing
// Used ChatGPT to help write this function in particular 
// Prompt to ChatGPT: help me track mouse movement when drawing by capturing movement using an array
// Note: I had to give ChatGPT my code for it to fully understand the prompt, and provide functional answers 
// Used Brace to further understand and break down the code 
canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    points.push([e.offsetX, e.offsetY]); 
    drawLine(board, x, y, e.offsetX, e.offsetY);
    drawingChangedEvent(); 
    x = e.offsetX; 
    y = e.offsetY;
  }
});

canvas.addEventListener("mouseup", () => {
  if (isDrawing) {
    points.push(null); // Null is used to indicate when the player isn't pressing down
    drawingChangedEvent();
    isDrawing = false;
  }
});

function drawLine(board: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  board.beginPath(); 
  board.strokeStyle = "black";
  board.lineWidth = 1;
  board.moveTo(x1, y1);
  board.lineTo(x2, y2);
  board.stroke();
  board.closePath();
}

function drawingChangedEvent() {
    const event = new Event("drawing-changed");
    canvas.dispatchEvent(event); // searched documentation for syntax
}

canvas.addEventListener("drawing-changed", () => {
    board.clearRect(0, 0, canvas.width, canvas.height);
    board.fillStyle = "#FFFFFF";
    board.fillRect(0, 0, canvas.width, canvas.height);

    let lastPoint: [number, number] | null = null;

    // Used Brace to help brainstorm on how to handle this
    for (const point of points) {
      if (point === null) {
        lastPoint = null;
      } else {
        if (lastPoint !== null) {
          drawLine(board, lastPoint[0], lastPoint[1], point[0], point[1]);
        }
        lastPoint = point;
      }
    }
  });

const undoAllButton = document.createElement("button"); 
undoAllButton.innerHTML = "Undo All Edits"; 
undoAllButton.style.margin = "25px";

// Brace helped write this code
undoAllButton.onclick = () => {
    board.clearRect(0, 0, canvas.width, canvas.height);
    board.fillStyle = "#FFFFFF";
    board.fillRect(0, 0, canvas.width, canvas.height);
}

app.append(undoAllButton);