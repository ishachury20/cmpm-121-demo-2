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

            // Used Brace to help write this section of code and understand it
            // This section checks if the value is null or not, and accordingly either creates a new stroke or sets the starting position
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

// Used Brace to create this section of code and understand it
// This section of code adds to the currentline array and goes through the drag function (in the Markerline class)
// The drag method tracks each set of points (so there is no need to store the values in another set of variables) 
canvas.addEventListener("mousemove", (e) => {
    if (isDrawing && currentLine) {
      currentLine.drag(e.offsetX, e.offsetY); 
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

// In your mousedown event
canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    const currentLine = new MarkerLine(e.offsetX, e.offsetY, currentLineWidth); // Use the globally set thickness
    points.push(currentLine);
    redoStack.length = 0;
    drawingChangedEvent();
});

function drawingChangedEvent() {
    const event = new Event("drawing-changed");
    canvas.dispatchEvent(event);
}

// Used Brace to help write and understand this code
// Clear the board, and then for each point in the points array, use the display function to create a line (visually showing them)
canvas.addEventListener("drawing-changed", () => {
    board.clearRect(0, 0, canvas.width, canvas.height);
    board.fillStyle = "#FFFFFF";
    board.fillRect(0, 0, canvas.width, canvas.height);

    for (const point of points) {
        if (point !== null) {
            point.display(board); 
        }
    }
});

// Went to Bahar's office hours to talk about redoStack and understand its logic 
// Used Brace to check conditions (whether the lastpoint was null or contained something)

const undoAllButton = document.createElement("button"); 
undoAllButton.innerHTML = "Undo All Edits"; 
undoAllButton.style.margin = "1px";

// Brace helped write this code
undoAllButton.onclick = () => {
    board.clearRect(0, 0, canvas.width, canvas.height);
    board.fillStyle = "#FFFFFF";
    board.fillRect(0, 0, canvas.width, canvas.height);

    points.length = 0; // Used Brace to add this line and set array length to 0 (clearing the array)
}

const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo Edits";
undoButton.style.margin = "1px";

undoButton.onclick = () => {
  if (points.length > 0) {
    const lastPoint = points.pop();
    if (lastPoint !== undefined) {
        redoStack.push(lastPoint);  
        drawingChangedEvent();
    }
  }
};

// Similar logic to undoButton
const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo Edits";
redoButton.style.margin = "1px";

redoButton.onclick = () => {
  if (redoStack.length > 0) {
    const redoPoint = redoStack.pop();
    if (redoPoint !== undefined) {
      points.push(redoPoint); 
      drawingChangedEvent();
    }
  }
};

const thinLineButton = document.createElement("button");
thinLineButton.innerHTML = "Thin";

thinLineButton.onclick = () => {
    currentLineWidth = 1;  // Example value for thin line
};


const thickLineButton = document.createElement("button");
thickLineButton.innerHTML = "Thick";

thickLineButton.onclick = () => {
    currentLineWidth = 3;  // Example value for thick line
};

app.append(thinLineButton);
app.append(thickLineButton);


app.append(thinLineButton);
app.append(thickLineButton);

app.append(undoAllButton); 
app.append(undoButton); 
app.append(redoButton); 