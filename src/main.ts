import "./style.css";

// Used Brace to help understand how to write classes

class MarkerLine {
    private points: Array<[number, number] | null>;
    private lineWidth: number;
    constructor(startX: number, startY: number, lineWidth: number = 1) {
        this.points = [[startX, startY]];
        this.lineWidth = lineWidth;
    }
    public drag(x: number, y: number) {
        this.points.push([x, y]);
    }
    public display(ctx: CanvasRenderingContext2D) {
        if (this.points.length > 1) {
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
    private sticker: string | null = null;
    constructor(size: number, sticker: string | null = null) {
        this.size = size;
        this.sticker = sticker;
    }
    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    draw(ctx: CanvasRenderingContext2D) { // Used documentation to understand this
        if (this.sticker) {
            ctx.font = `${this.size}px serif`;
            ctx.fillStyle = "red";
            ctx.fillText(this.sticker, this.x, this.y);
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.strokeStyle = "black";
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.closePath();
        }
    }
    
}

// Please note: I used Brace a lot for the ToolPreview class (getting a lot of the code from it) because I had the visibility set too low to actually see it
// I had pre-existing code before I asked Brace to help me write so much of it
// I figured this out much later, but it mostly ended up being similar (and I made sure to ask a lot of non-code questions to understand what I was doing)

// I used Brace again to re-write a better version for step 8 (after its due date) that condensed functions in the StickerCommand class 
// I inputted my previous code directly into Brace and asked for how to condense it into the class itself 
// This took multiple prompts, and iterations (with certain features missing) to work properly

class StickerCommand {
    private x: number;
    private y: number;
    sticker: string;
    constructor(x: number, y: number, sticker: string) {
        this.x = x;
        this.y = y;
        this.sticker = sticker;
    }
    public place(x: number, y: number, points: Array<MarkerLine | StickerCommand | null>) {
        this.x = x;
        this.y = y;
        points.push(new StickerCommand(x, y, this.sticker));
    }
    public display(ctx: CanvasRenderingContext2D) {
        ctx.font = '40px serif';
        ctx.fillStyle = "black"; 
        ctx.fillText(this.sticker, this.x, this.y);
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
let currentLineWidth = 1;

// Brace helped write parts of these variables 

let currentLine: MarkerLine | null = null; // this is the current line being drawn (set to null in the beginning)
let toolPreview: ToolPreview = new ToolPreview(currentLineWidth * 5, null); // Used for the circle under the cursor 
let currentSticker: StickerCommand | null = null; // used to hold stickers
let isStickerActive = false;

const points: Array<MarkerLine | StickerCommand | null> = []; // array to hold new points (holds all Markerline information)
const redoStack: Array<MarkerLine | StickerCommand | null> = []; // array used to hold previous points (used for undo/redo)


function clearStickerMode() {
    isStickerActive = false;
    currentSticker = null;
    toolPreview = new ToolPreview(currentLineWidth * 5, null); // Reset to line preview
}

canvas.addEventListener("mousedown", (e) => {
    const x = e.offsetX;
    const y = e.offsetY;
    if (!isStickerActive) {
        isDrawing = true;
        currentLine = new MarkerLine(x, y, currentLineWidth);
        points.push(currentLine);
    } else if (isStickerActive && currentSticker) {
        currentSticker.place(x, y, points); // add the sticker in this location 
        drawingChangedEvent(); // indicate the board has changed 
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
        drawingChangedEvent(); // Brace suggested this for performance improvements
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
// Brace was used to help create the clearStickerMode function and the isStickerActive boolean 
// These were because when the sticker preview disappeared after the user clicked the board


// Used Brace to suggest similar code and edited it to suit this assignment 

const buttonIds = ["🌟", "🔥", "😭"];
buttonIds.forEach(emoji => createStickerButton(emoji));

// Function to handle sticker activation
function handleButtonClick(stickerContent: string) {
    toolPreview = new ToolPreview(40, stickerContent);
    currentSticker = new StickerCommand(0, 0, stickerContent);
    isStickerActive = true;
    redrawCanvas();
}

// Function to create a sticker button
function createStickerButton(stickerContent: string) {
    const buttonElement = document.createElement("button");
    buttonElement.innerText = stickerContent;
    buttonElement.addEventListener("click", () => handleButtonClick(stickerContent));
    app.append(buttonElement);
}

// Button to prompt for a custom sticker
const customStickerButton = document.createElement("button");
customStickerButton.innerText = "Custom Sticker";
customStickerButton.addEventListener("click", () => {
    const customSticker = prompt("Enter a custom sticker or text:", "✨");
    if (customSticker && customSticker.trim()) {  // Use Brace to help write this
        createStickerButton(customSticker); 
        handleButtonClick(customSticker); 
    }
});
app.append(customStickerButton); 

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
        const lastPoint = points.pop();
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
        const lastRedo = redoStack.pop();
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
    currentLineWidth = 1;
    toolPreview = new ToolPreview(currentLineWidth * 5, null);
};

const thickLineButton = document.createElement("button");
thickLineButton.innerHTML = "Thick";
thickLineButton.onclick = () => {
    clearStickerMode();
    currentLineWidth = 3;
    toolPreview = new ToolPreview(currentLineWidth * 5, null);
};

app.append(thinLineButton);
app.append(thickLineButton);
app.appendChild(undoAllButton);
app.appendChild(undoButton);
app.appendChild(redoButton);