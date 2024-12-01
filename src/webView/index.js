
const cvs = document.getElementById('cvs');
cvs.width = 1000;
cvs.height = 1000;
const ctx = cvs.getContext('2d');
const LOG_SIZE = 10;
const LOG_X = 450;
const LOG_Y = 0;
const PALETTE_WIDTH = 26;
const PALETTE_HEIGTH = 26;
const PALETTE_X = 0;
const PALETTE_Y = 290;
const GAME_X = 90;
const GAME_Y = 0;


window.addEventListener('load', init);
window.addEventListener("message", event =>{
  const message = event.data;
  if (message.imageData){
    let imgData = ctx.createImageData(256, 240);
    for (let i = 0; i<imgData.data.length; i++){
      imgData.data[i]=message.imageData[i];
    }
    ctx.putImageData(imgData, GAME_X, GAME_Y + 20);
  }
  if (message.CPULOG){
    ctx.clearRect(LOG_X, LOG_Y + 20, 480, 240);
    ctx.fillStyle = "green";
    ctx.fillRect(LOG_X + 20, LOG_Y + 228, 300, 18);
    ctx.font = "20px Courier New";
    ctx.fillStyle = "white";
    ctx.fillText(message.CPULOG[LOG_SIZE], LOG_X, LOG_Y + 40);
    ctx.font = "16px Courier New";
    for (let i = 0; i < LOG_SIZE; i++){
      ctx.fillText(message.CPULOG[i], LOG_X + 20, LOG_Y + 80 + 18*i);
    }
  }
  if (message.ColorPalettes){
    let paletteImage = ctx.createImageData(PALETTE_WIDTH * 16, PALETTE_HEIGTH * 4);
    for (let i = 0; i < 4; i++){
      for (let j = 0; j < 16; j++){
        for (let h = 0; h < PALETTE_HEIGTH; h++){
          for(let w = 0; w < PALETTE_WIDTH; w++){
            paletteImage.data[((i*16*PALETTE_HEIGTH + j + h*16)*PALETTE_WIDTH + w)*4 + 0] = message.ColorPalettes[(i*16+j)*4 + 0];
            paletteImage.data[((i*16*PALETTE_HEIGTH + j + h*16)*PALETTE_WIDTH + w)*4 + 1] = message.ColorPalettes[(i*16+j)*4 + 1];
            paletteImage.data[((i*16*PALETTE_HEIGTH + j + h*16)*PALETTE_WIDTH + w)*4 + 2] = message.ColorPalettes[(i*16+j)*4 + 2];
            paletteImage.data[((i*16*PALETTE_HEIGTH + j + h*16)*PALETTE_WIDTH + w)*4 + 3] = message.ColorPalettes[(i*16+j)*4 + 3];
          }
        }
      }
    }
    ctx.font = "11px Courier New";
    ctx.fillStyle = "white";
    for (let i = 0; i < 16; i++){
      ctx.fillText("$"+ i.toString(16).padStart(2, "0").toUpperCase(), PALETTE_X + 30 + PALETTE_WIDTH*i, PALETTE_Y);
    }
    ctx.fillText("$00", PALETTE_X, PALETTE_Y + 25);
    ctx.fillText("$10", PALETTE_X, PALETTE_Y + 25 + PALETTE_HEIGTH);
    ctx.fillText("$20", PALETTE_X, PALETTE_Y + 25 + PALETTE_HEIGTH*2);
    ctx.fillText("$30", PALETTE_X, PALETTE_Y + 25 + PALETTE_HEIGTH*3);
    ctx.putImageData(paletteImage,PALETTE_X + 30, PALETTE_Y + 10);
  }
});

function init(){
  // init
}
