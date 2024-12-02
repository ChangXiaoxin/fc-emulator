
const cvs = document.getElementById('cvs');
cvs.width = 1000;
cvs.height = 1000;
const ctx = cvs.getContext('2d');
const LOG_SIZE = 10;
const LOG_X = 450;
const LOG_Y = 0;
const COLOR_PALETTE_WIDTH = 26;
const COLOR_PALETTE_HEIGTH = 26;
const COLOR_PALETTE_X = 0;
const COLOR_PALETTE_Y = 290;
const PALETTE_RAM_X = 0;
const PALETTE_RAM_Y = COLOR_PALETTE_Y + 25 + COLOR_PALETTE_HEIGTH*4;
const PALETTE_RAM_WIDTH = 26;
const PALETTE_RAM_HEIGTH = 26;
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
    ctx.clearRect(LOG_X, LOG_Y + 20, 550, 240);
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
    let paletteImage = ctx.createImageData(COLOR_PALETTE_WIDTH * 16, COLOR_PALETTE_HEIGTH * 4);
    for (let i = 0; i < 4; i++){
      for (let j = 0; j < 16; j++){
        for (let h = 0; h < COLOR_PALETTE_HEIGTH; h++){
          for(let w = 0; w < COLOR_PALETTE_WIDTH; w++){
            let edge = (h === 0) || (w === 0) || (h === (COLOR_PALETTE_HEIGTH-1)) || (w === (COLOR_PALETTE_WIDTH-1));
            paletteImage.data[((i*16*COLOR_PALETTE_HEIGTH + j + h*16)*COLOR_PALETTE_WIDTH + w)*4 + 0] = edge ? 0 : message.ColorPalettes[(i*16+j)*4 + 0];
            paletteImage.data[((i*16*COLOR_PALETTE_HEIGTH + j + h*16)*COLOR_PALETTE_WIDTH + w)*4 + 1] = edge ? 0 : message.ColorPalettes[(i*16+j)*4 + 1];
            paletteImage.data[((i*16*COLOR_PALETTE_HEIGTH + j + h*16)*COLOR_PALETTE_WIDTH + w)*4 + 2] = edge ? 0 : message.ColorPalettes[(i*16+j)*4 + 2];
            paletteImage.data[((i*16*COLOR_PALETTE_HEIGTH + j + h*16)*COLOR_PALETTE_WIDTH + w)*4 + 3] = edge ? 0 : message.ColorPalettes[(i*16+j)*4 + 3];
          }
        }
      }
    }
    ctx.font = "11px Courier New";
    ctx.fillStyle = "white";
    for (let i = 0; i < 16; i++){
      ctx.fillText("$"+ i.toString(16).padStart(2, "0").toUpperCase(), COLOR_PALETTE_X + 30 + COLOR_PALETTE_WIDTH*i, COLOR_PALETTE_Y);
    }
    ctx.fillText("$00", COLOR_PALETTE_X, COLOR_PALETTE_Y + 25);
    ctx.fillText("$10", COLOR_PALETTE_X, COLOR_PALETTE_Y + 25 + COLOR_PALETTE_HEIGTH);
    ctx.fillText("$20", COLOR_PALETTE_X, COLOR_PALETTE_Y + 25 + COLOR_PALETTE_HEIGTH*2);
    ctx.fillText("$30", COLOR_PALETTE_X, COLOR_PALETTE_Y + 25 + COLOR_PALETTE_HEIGTH*3);
    ctx.putImageData(paletteImage,COLOR_PALETTE_X + 30, COLOR_PALETTE_Y + 10);
  }

  if (message.Palettes){
    let paletteImage = ctx.createImageData(PALETTE_RAM_WIDTH * 16, PALETTE_RAM_HEIGTH * 4);
    for (let i = 0; i < 2; i++){
      for (let j = 0; j < 16; j++){
        for (let h = 0; h < PALETTE_RAM_HEIGTH; h++){
          for(let w = 0; w < PALETTE_RAM_WIDTH; w++){
            let edge = (h === 0) || (w === 0) || (h === (PALETTE_RAM_HEIGTH-1)) || (w === (PALETTE_RAM_WIDTH-1));
            paletteImage.data[((i*16*PALETTE_RAM_HEIGTH + j + h*16)*PALETTE_RAM_WIDTH + w)*4 + 0] = edge ? 0 : message.Palettes[(i*16+j)*4 + 0];
            paletteImage.data[((i*16*PALETTE_RAM_HEIGTH + j + h*16)*PALETTE_RAM_WIDTH + w)*4 + 1] = edge ? 0 : message.Palettes[(i*16+j)*4 + 1];
            paletteImage.data[((i*16*PALETTE_RAM_HEIGTH + j + h*16)*PALETTE_RAM_WIDTH + w)*4 + 2] = edge ? 0 : message.Palettes[(i*16+j)*4 + 2];
            paletteImage.data[((i*16*PALETTE_RAM_HEIGTH + j + h*16)*PALETTE_RAM_WIDTH + w)*4 + 3] = edge ? 0 : message.Palettes[(i*16+j)*4 + 3];
          }
        }
      }
    }
    ctx.clearRect(PALETTE_RAM_X, PALETTE_RAM_Y, PALETTE_RAM_X + 30 + PALETTE_RAM_WIDTH*16, PALETTE_RAM_HEIGTH);
    ctx.clearRect(PALETTE_RAM_X, PALETTE_RAM_Y + PALETTE_RAM_HEIGTH, 30, PALETTE_RAM_HEIGTH * 3);
    ctx.font = "11px Courier New";
    ctx.fillStyle = "white";
    for (let i = 0; i < 16; i++){
      ctx.fillText("$"+ i.toString(16).toUpperCase(), PALETTE_RAM_X + 30 + PALETTE_RAM_WIDTH*i, PALETTE_RAM_Y + PALETTE_RAM_HEIGTH);
    }
    ctx.fillText("$3F0", PALETTE_RAM_X, PALETTE_RAM_Y + PALETTE_RAM_HEIGTH + 25);
    ctx.fillText("$3F1", PALETTE_RAM_X, PALETTE_RAM_Y + PALETTE_RAM_HEIGTH + 25 + PALETTE_RAM_HEIGTH);
    ctx.putImageData(paletteImage,PALETTE_RAM_X + 30, PALETTE_RAM_Y + PALETTE_RAM_HEIGTH + 10);
  }

  if (message.patternImage){
    let paletteImage = ctx.createImageData(16*8, 16*8);
    for(let i = 0; i < paletteImage.data.length; i++){
      paletteImage.data[i] = message.patternImage[i];
    }
    ctx.font = "11px Courier New";
    ctx.fillStyle = "white";
    ctx.fillText("Pattern Table 0", COLOR_PALETTE_X + COLOR_PALETTE_WIDTH*18, COLOR_PALETTE_Y);
    ctx.putImageData(paletteImage,COLOR_PALETTE_X + COLOR_PALETTE_WIDTH*18, COLOR_PALETTE_Y + 10);
  }

  if (message.patternImage2){
    let paletteImage = ctx.createImageData(16*8, 16*8);
    for(let i = 0; i < paletteImage.data.length; i++){
      paletteImage.data[i] = message.patternImage2[i];
    }
    ctx.font = "11px Courier New";
    ctx.fillStyle = "white";
    ctx.fillText("Pattern Table 1", COLOR_PALETTE_X + COLOR_PALETTE_WIDTH*18 + 16*8 + 20, COLOR_PALETTE_Y);
    ctx.putImageData(paletteImage,COLOR_PALETTE_X + COLOR_PALETTE_WIDTH*18 + 16*8 + 20, COLOR_PALETTE_Y + 10);
  }
});

function init(){
  // init
}
