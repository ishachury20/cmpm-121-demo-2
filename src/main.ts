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

