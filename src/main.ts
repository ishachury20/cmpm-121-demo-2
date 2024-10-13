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
canvas.style.border = "2px solid #4682B4"; 
canvas.style.borderRadius = "5px";
canvas.style.boxShadow = "2px 2px #244c6e"; 

app.appendChild(canvas);

const board = canvas.getContext("2d")!;
board.fillStyle = "#FFFFFF"; 
board.fillRect(0, 0, canvas.width, canvas.height); 

let isDrawing = false; 
let x = 0;
let y = 0;

canvas.addEventListener("mousedown", (e) => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = true;
});

canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
      drawLine(board, x, y, e.offsetX, e.offsetY);
      x = e.offsetX;
      y = e.offsetY;
    }
});

globalThis.addEventListener("mouseup", (e) => {
    drawLine(board, x, y, e.offsetX, e.offsetY);
    x = 0;
    y = 0;
    isDrawing = false;
  }
);

function drawLine(board: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
    board.beginPath();
    board.strokeStyle = "black";
    board.lineWidth = 1;
    board.moveTo(x1, y1);
    board.lineTo(x2, y2);
    board.stroke();
    board.closePath();
}; 

const undoAllButton = document.createElement("button"); 
undoAllButton.innerHTML = "Undo All Edits"; 
undoAllButton.style.margin = "25px"

undoAllButton.onclick = () => {
    board.clearRect(0, 0, canvas.width, canvas.height);
    board.fillStyle = "#FFFFFF";
    board.fillRect(0, 0, canvas.width, canvas.height);
}

app.append(undoAllButton);