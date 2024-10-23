import "./style.css";

// Used Brace to help understand how to write classes

class MarkerLine {
    private points: Array<[number, number] | null>; 
    private lineWidth: number; 

    constructor(startX: number, startY: number, lineWidth: number = 1) {
        this.points = [[startX, startY]];
        this.lineWidth = lineWidth;
    }

    // adds new set of points to the point array 
    public drag(x: number, y: number) {
        this.points.push([x, y]);
    }

    public display(ctx: CanvasRenderingContext2D) {
        if (this.points.length > 1) {  // Ensure there are points to draw
            ctx.beginPath();
            ctx.strokeStyle = "black"; 
            ctx.lineWidth = this.lineWidth; 

            let isNewStroke = true;
        
            for (const point of this.points) {
                if (point === null) {
                    isNewStroke = true;
                } else {
                    const [x, y] = point; 
                    if (isNewStroke) {
                        ctx.moveTo(x, y); // starting point (when not null)
                        isNewStroke = false;
                    } else {
                        ctx.lineTo(x, y); // next point in the array
                    }
                }
            }
            ctx.stroke();
            ctx.closePath();
        }
    }
}

// Used Brace to help write and understand this class
// The class takes in the size of the line, and the x and y position of the cursor 
// It uses the update method to track their recent position, while draw focuses on creating a circle to follow the cursor  
class ToolPreview {
    private x: number = 0;
    private y: number = 0;
    private size: number;

    constructor(size: number) {
        this.size = size;
    }

    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.x != null && this.y != null) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.strokeStyle = "black";
            ctx.lineWidth = 3; // default 
            ctx.stroke();
            ctx.closePath();
        }
    }
}

// Please note: I used Brace a lot for the ToolPreview class (getting a lot of the code from it) because I had the visibility set too low to actually see it
// I had pre-existing code before I asked Brace to help me write so much of it
// I figured this out much later, but it mostly ended up being similar (and I made sure to ask a lot of non-code questions to understand what I was doing)

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
let currentLineWidth = 1;
let currentLine: MarkerLine | null = null; 
let toolPreview: ToolPreview | null = new ToolPreview(currentLineWidth);

const points: Array<MarkerLine | null> = []; //array to hold new points (holds all Markerline information)
const redoStack: Array<MarkerLine | null> = []; //array used to hold previous points (used for undo/redo)

canvas.addEventListener("mousedown", (e) => {
    const x = e.offsetX;
    const y = e.offsetY;
    isDrawing = true;
    currentLine = new MarkerLine(x, y, currentLineWidth); // array used for capturing recent points user drew (points holds all, currentLine holds most recent) 
    points.push(currentLine); 
    redoStack.length = 0; 
    drawingChangedEvent();
});

canvas.addEventListener("mousemove", (e) => {
    const x = e.offsetX; 
    const y = e.offsetY;
    
    if (!isDrawing && toolPreview) {
        toolPreview.updatePosition(x, y);
        toolMovedEvent(); // call this event so that when the mouse moves, you get a circle following it

    } else if (isDrawing && currentLine) { // Brace helped me fix some logic on this part
        currentLine.drag(x, y);
        drawingChangedEvent();  
    }
});

canvas.addEventListener("mouseup", () => {
    if (isDrawing) {
        currentLine = null;
        drawingChangedEvent();
        isDrawing = false;
    }
});

canvas.addEventListener("mouseleave", () => {
    toolPreview = null;  
    redrawCanvas();  // Used ChatGPT to help use redrawcanvas instead of just clearing the board 
});

function drawingChangedEvent() {
    const event = new Event("drawing-changed");
    canvas.dispatchEvent(event);
}

function toolMovedEvent() {
    const event = new Event("tool-moved");
    canvas.dispatchEvent(event);
}

// Helper function to redraw the entire canvas and existing lines
function redrawCanvas() {
    // Clear the entire canvas
    board.clearRect(0, 0, canvas.width, canvas.height);
    board.fillStyle = "#FFFFFF";
    board.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw existing lines
    for (const point of points) {
        if (point !== null) {
            point.display(board);
        }
    }
}

// Brace helped me re-write this code
canvas.addEventListener("drawing-changed", () => {
    redrawCanvas();
});


canvas.addEventListener("tool-moved", () => {
    if (toolPreview) {
        redrawCanvas();
        toolPreview.draw(board);
    }
});

// Undo all edits
const undoAllButton = document.createElement("button"); 
undoAllButton.innerHTML = "Undo All Edits"; 
undoAllButton.style.margin = "1px";

undoAllButton.onclick = () => {
    board.clearRect(0, 0, canvas.width, canvas.height);
    board.fillStyle = "#FFFFFF";
    board.fillRect(0, 0, canvas.width, canvas.height);

    points.length = 0; // clear the array
}

const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo Edits";
undoButton.style.margin = "1px";

undoButton.onclick = () => {
  if (points.length > 0) {
    const lastPoint = points.pop();
    if (lastPoint !== undefined) {
        redoStack.push(lastPoint);  
    }
    drawingChangedEvent();
  }
};

// Redo edits
const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo Edits";
redoButton.style.margin = "1px";

redoButton.onclick = () => {
  if (redoStack.length > 0) {
    const redoPoint = redoStack.pop();
    if (redoPoint !== undefined) {
      points.push(redoPoint); 
    }
    drawingChangedEvent();
  }
};


const thinLineButton = document.createElement("button");
thinLineButton.innerHTML = "Thin";

thinLineButton.onclick = () => {
    currentLineWidth = 3;  
    toolPreview = new ToolPreview(currentLineWidth); 
};

// Thick line option
const thickLineButton = document.createElement("button");
thickLineButton.innerHTML = "Thick";

thickLineButton.onclick = () => {
    currentLineWidth = 7;  // Example value for thick line// Update tool preview size
};

app.append(thinLineButton);
app.append(thickLineButton);

app.append(undoAllButton); 
app.append(undoButton); 
app.append(redoButton);