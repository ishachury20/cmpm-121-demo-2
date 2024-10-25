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

// Please note: I used Brace a lot for the ToolPreview class (getting a lot of the code from it) because I had the visibility set too low to actually see it
// I had pre-existing code before I asked Brace to help me write so much of it
// I figured this out much later, but it mostly ended up being similar (and I made sure to ask a lot of non-code questions to understand what I was doing)

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

    draw(ctx: CanvasRenderingContext2D) {
        if (this.sticker) {
            ctx.font = `${this.size}px serif`;
            ctx.fillText(this.sticker, this.x, this.y);
        } else {
            if(this.x != null && this.y != null){
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
                ctx.strokeStyle = "black";
                ctx.lineWidth = 1; // default 
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
}

// Used Brace to understand and help write this section of code

class StickerCommand {
    private x: number;
    private y: number;
    sticker: string;

    constructor(x: number, y: number, sticker: string) {
        this.x = x;
        this.y = y;
        this.sticker = sticker;
    }

    public drag(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public display(ctx: CanvasRenderingContext2D) {
        ctx.font = '40px serif'; // Used Brace to write this
        ctx.fillText(this.sticker, this.x, this.y);
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
let toolPreview: ToolPreview | null = new ToolPreview(currentLineWidth);
let currentSticker: StickerCommand | null = null;
let isStickerActive = false; // Tracks whether a sticker is being dragged or not

const points: Array<MarkerLine | StickerCommand | null> = []; //array to hold new points (holds all Markerline information)
const redoStack: Array<MarkerLine | StickerCommand | null> = []; //array used to hold previous points (used for undo/redo)

// Function created to get out of clicking on the sticker 
function clearStickerMode() {
    isStickerActive = false;
    currentSticker = null;
    toolPreview = null;
    canvas.removeEventListener("mousemove", dragSticker);
    canvas.removeEventListener("mousedown", placeSticker);
}


// Needed to add these functions to get rid of some bugs
// Previously, when the user clicked on the sticker, and tried to go to another, they would see one more of the previous sticker before it changed
function dragSticker(e: MouseEvent) {
    const x = e.offsetX;
    const y = e.offsetY;
    
    if (toolPreview) {
        toolPreview.updatePosition(x, y);
        toolMovedEvent(); 
    }
}

function placeSticker(e: MouseEvent) {
    const x = e.offsetX;
    const y = e.offsetY;

    if (currentSticker) {
        currentSticker.drag(x, y);
        points.push(currentSticker);
        currentSticker = new StickerCommand(x, y, currentSticker.sticker); // Reset currentSticker to allow placing again
        drawingChangedEvent();
    }
}

// Used Brace to understand how isSticker would be added
canvas.addEventListener("mousedown", (e) => {
    const x = e.offsetX;
    const y = e.offsetY;

    if (!isStickerActive) {
        isDrawing = true;
        currentLine = new MarkerLine(x, y, currentLineWidth);
        points.push(currentLine); 
    } else {
        currentLine = new MarkerLine(x, y, currentLineWidth); 
        points.push(currentLine); 
    }
    redoStack.length = 0; 
    drawingChangedEvent();
});

canvas.addEventListener("mousemove", (e) => {
    const x = e.offsetX; 
    const y = e.offsetY;
    
    if (!isDrawing && toolPreview && !isStickerActive) {
        toolPreview.updatePosition(x, y);
        toolMovedEvent();
    } else if (isDrawing && currentLine) {
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
    redrawCanvas(); // Used ChatGPT to help use redrawcanvas instead of just clearing the board 
});

// Brace helped me re-write this code
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
    board.clearRect(0, 0, canvas.width, canvas.height);
    board.fillStyle = "#FFFFFF";
    board.fillRect(0, 0, canvas.width, canvas.height);

    for (const point of points) {
        if (point !== null) {
            point.display(board);
        }
    }
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

// Sticker buttons
const sticker1Button = document.createElement("button");
sticker1Button.innerText = "🌟";
sticker1Button.onclick = () => {
    toolPreview = new ToolPreview(40, "🌟");
    toolMovedEvent();
    currentSticker = new StickerCommand(0, 0, "🌟");
    isStickerActive = true;
    canvas.addEventListener("mousemove", dragSticker);
    canvas.addEventListener("mousedown", placeSticker);
};

const sticker2Button = document.createElement("button");
sticker2Button.innerText = "🔥";
sticker2Button.onclick = () => {
    toolPreview = new ToolPreview(40, "🔥");
    toolMovedEvent();
    currentSticker = new StickerCommand(0, 0, "🔥");
    isStickerActive = true;
    canvas.addEventListener("mousemove", dragSticker);
    canvas.addEventListener("mousedown", placeSticker);
};

const sticker3Button = document.createElement("button");
sticker3Button.innerText = "😭";
sticker3Button.onclick = () => {
    toolPreview = new ToolPreview(40, "😭");
    toolMovedEvent();
    currentSticker = new StickerCommand(0, 0, "😭");
    isStickerActive = true;
    canvas.addEventListener("mousemove", dragSticker);
    canvas.addEventListener("mousedown", placeSticker);
};

// Append buttons to the app
app.appendChild(sticker1Button);
app.appendChild(sticker2Button);
app.appendChild(sticker3Button);

// Undo/Redo/Other Buttons
const undoAllButton = document.createElement("button"); 
undoAllButton.innerHTML = "Undo All Edits"; 
undoAllButton.style.margin = "1px";

undoAllButton.onclick = () => {
    board.clearRect(0, 0, canvas.width, canvas.height);
    board.fillStyle = "#FFFFFF";
    board.fillRect(0, 0, canvas.width, canvas.height);

    points.length = 0;
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
        drawingChangedEvent();
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
        drawingChangedEvent();   
    }
};
const thinLineButton = document.createElement("button");
thinLineButton.innerHTML = "Thin";

thinLineButton.onclick = () => {
    clearStickerMode(); // Switch to line drawing mode
    currentLineWidth = 1;
    toolPreview = new ToolPreview(currentLineWidth);
};

// Thick line option
const thickLineButton = document.createElement("button");
thickLineButton.innerHTML = "Thick";

thickLineButton.onclick = () => {
    clearStickerMode(); // Switch to line drawing mode
    currentLineWidth = 3;
};

app.append(thinLineButton);
app.append(thickLineButton);

// Add buttons to the app
app.appendChild(undoAllButton);
app.appendChild(undoButton);
app.appendChild(redoButton);