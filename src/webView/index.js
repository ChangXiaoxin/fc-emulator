
const vscode = acquireVsCodeApi();
const cvs = document.getElementById('cvs');
cvs.width = 2000;
cvs.height = 1200;
const ctx = cvs.getContext('2d');
const LOG_SIZE = 10;
const LOG_X = 520;
const LOG_Y = 0;
const COLOR_PALETTE_WIDTH = 26;
const COLOR_PALETTE_HEIGTH = 26;
const COLOR_PALETTE_X = 20;
const COLOR_PALETTE_Y = 525;
const PALETTE_RAM_X = 520;
const PALETTE_RAM_Y = 520;
const PALETTE_RAM_WIDTH = 30;
const PALETTE_RAM_HEIGTH = 30;
const GAME_X = 0;
const GAME_Y = 30;
const GAME_TILE_X = 2;
const GAME_TILE_Y = 2;
const PALETTE_TABLE_X = 520;
const PALETTE_TABLE_Y = 250;
const PALETTE_TABLE_TILE_X = 2;
const PALETTE_TABLE_TILE_Y = 2;

const NAME_TABLE_X = 1070;
const NAME_TABLE_Y = GAME_Y;

window.addEventListener('load', init);
document.addEventListener("keydown", event =>{
  vscode.postMessage({keypressed: event.code});
});
document.addEventListener("keyup", event =>{
  vscode.postMessage({keyreleased: event.code});
});
window.addEventListener("message", event =>{
  const message = event.data;
  if (message.controllerInput){
    ctx.clearRect(PALETTE_TABLE_X + 120 + (message.controllerInput[0]-1) * (16*8*PALETTE_TABLE_TILE_X + 20), PALETTE_TABLE_Y - 10, 120, 12);
    ctx.font = "12px Courier New";
    ctx.fillStyle = "white";
    ctx.fillText(message.controllerInput[1].toString(2), PALETTE_TABLE_X + 120 + (message.controllerInput[0]-1) * (16*8*PALETTE_TABLE_TILE_X + 20), PALETTE_TABLE_Y);
  }
  if (message.imageData){
    let imgData = drawImageWithTileCRT(256, 240, GAME_TILE_X, GAME_TILE_Y, message.imageData);
    ctx.putImageData(imgData, GAME_X, GAME_Y);
  }
  if (message.CPULOG){
    ctx.clearRect(LOG_X, LOG_Y + 20, 550, 220);
    ctx.fillStyle = "green";
    ctx.fillRect(LOG_X + 20, LOG_Y + 228 - 15, 300, 18);
    ctx.font = "20px Courier New";
    ctx.fillStyle = "white";
    ctx.fillText(message.CPULOG[LOG_SIZE], LOG_X, LOG_Y + 40);
    ctx.font = "16px Courier New";
    for (let i = 0; i < LOG_SIZE; i++){
      ctx.fillText(message.CPULOG[i], LOG_X + 20, LOG_Y + 80 - 15 + 18*i);
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
      ctx.fillText("$"+ i.toString(16).padStart(2, "0").toUpperCase(), COLOR_PALETTE_X + 25 + COLOR_PALETTE_WIDTH*i, COLOR_PALETTE_Y);
    }
    ctx.fillText("$00", COLOR_PALETTE_X, COLOR_PALETTE_Y + 20);
    ctx.fillText("$10", COLOR_PALETTE_X, COLOR_PALETTE_Y + 20 + COLOR_PALETTE_HEIGTH);
    ctx.fillText("$20", COLOR_PALETTE_X, COLOR_PALETTE_Y + 20 + COLOR_PALETTE_HEIGTH*2);
    ctx.fillText("$30", COLOR_PALETTE_X, COLOR_PALETTE_Y + 20 + COLOR_PALETTE_HEIGTH*3);
    ctx.putImageData(paletteImage,COLOR_PALETTE_X + 25, COLOR_PALETTE_Y + 5);
  }

  if (message.Palettes){
    let paletteImage = ctx.createImageData(PALETTE_RAM_WIDTH * 16, PALETTE_RAM_HEIGTH * 4);
    let border = 0x00;
    for (let i = 0; i < 2; i++){
      for (let j = 0; j < 16; j++){
        if((i * 16 + j)/4 >= message.Palettes[16*2*4] && (i * 16 + j)/4 < (message.Palettes[16*2*4]+1)){
          border = 0xCF;
        }
        else{
          border = 0x00;
        }
        for (let h = 0; h < PALETTE_RAM_HEIGTH; h++){
          for(let w = 0; w < PALETTE_RAM_WIDTH; w++){
            let edge = (h === 0) || (w === 0) || (h === (PALETTE_RAM_HEIGTH-1)) || (w === (PALETTE_RAM_WIDTH-1));
            paletteImage.data[((i*16*PALETTE_RAM_HEIGTH + j + h*16)*PALETTE_RAM_WIDTH + w)*4 + 0] = edge ? 0 : message.Palettes[(i*16+j)*4 + 0];
            paletteImage.data[((i*16*PALETTE_RAM_HEIGTH + j + h*16)*PALETTE_RAM_WIDTH + w)*4 + 1] = edge ? border : message.Palettes[(i*16+j)*4 + 1];
            paletteImage.data[((i*16*PALETTE_RAM_HEIGTH + j + h*16)*PALETTE_RAM_WIDTH + w)*4 + 2] = edge ? 0 : message.Palettes[(i*16+j)*4 + 2];
            paletteImage.data[((i*16*PALETTE_RAM_HEIGTH + j + h*16)*PALETTE_RAM_WIDTH + w)*4 + 3] = edge ? border : message.Palettes[(i*16+j)*4 + 3];
          }
        }
      }
    }
    ctx.clearRect(PALETTE_RAM_X, PALETTE_RAM_Y, 30 + PALETTE_RAM_WIDTH*16, PALETTE_RAM_HEIGTH);
    ctx.clearRect(PALETTE_RAM_X, PALETTE_RAM_Y + PALETTE_RAM_HEIGTH, 35, PALETTE_RAM_HEIGTH * 3);
    ctx.font = "11px Courier New";
    ctx.fillStyle = "white";
    for (let i = 0; i < 16; i++){
      ctx.fillText("$0"+ i.toString(16).toUpperCase(), PALETTE_RAM_X + 40 + PALETTE_RAM_WIDTH*i, PALETTE_RAM_Y + PALETTE_RAM_HEIGTH);
    }
    ctx.fillText("$3F00", PALETTE_RAM_X, PALETTE_RAM_Y + PALETTE_RAM_HEIGTH + 25);
    ctx.fillText("$3F10", PALETTE_RAM_X, PALETTE_RAM_Y + PALETTE_RAM_HEIGTH + 25 + PALETTE_RAM_HEIGTH);
    ctx.putImageData(paletteImage, PALETTE_RAM_X + 40, PALETTE_RAM_Y + PALETTE_RAM_HEIGTH + 10);
  }

  if (message.patternImage){
    let paletteImage = drawImageWithTileCRT(16*8, 16*8, PALETTE_TABLE_TILE_X, PALETTE_TABLE_TILE_Y, message.patternImage);
    ctx.clearRect(PALETTE_TABLE_X, PALETTE_TABLE_Y - 10, 120, 12);
    ctx.font = "12px Courier New";
    ctx.fillStyle = "white";
    ctx.fillText("Pattern Table 0", PALETTE_TABLE_X, PALETTE_TABLE_Y);
    ctx.putImageData(paletteImage,PALETTE_TABLE_X, PALETTE_TABLE_Y + 5);
  }

  if (message.patternImage2){
    let paletteImage = drawImageWithTileCRT(16*8, 16*8, PALETTE_TABLE_TILE_X, PALETTE_TABLE_TILE_Y, message.patternImage2);
    ctx.clearRect(PALETTE_TABLE_X + 16*8*PALETTE_TABLE_TILE_X + 20, PALETTE_TABLE_Y - 10, 120, 12);
    ctx.font = "12px Courier New";
    ctx.fillStyle = "white";
    ctx.fillText("Pattern Table 1", PALETTE_TABLE_X + 16*8*PALETTE_TABLE_TILE_X + 20, PALETTE_TABLE_Y);
    ctx.putImageData(paletteImage, PALETTE_TABLE_X + 16*8*PALETTE_TABLE_TILE_X + 20, PALETTE_TABLE_Y + 5);
  }

  if (message.nameTable){
    let paletteImage = drawImageWithTile(256, 240, 1, 1, message.nameTable);
    switch (message.nameTable[256*240*4]){
      case 0:
        ctx.putImageData(paletteImage, NAME_TABLE_X, NAME_TABLE_Y);
        break;
      case 1:
        ctx.putImageData(paletteImage, NAME_TABLE_X + 256, NAME_TABLE_Y);
        break;
      case 2:
        ctx.putImageData(paletteImage, NAME_TABLE_X, NAME_TABLE_Y + 240);
        break;
      case 3:
        ctx.putImageData(paletteImage, NAME_TABLE_X + 256, NAME_TABLE_Y + 240);
        break;
    }
  }
});

function drawImageWithTileCRT(image_w, image_h, tile_w, tile_h, image_in){
  let image = ctx.createImageData(image_w * tile_w, image_h * tile_h);
  for (let i = 0; i < image_h; i++){
    for (let j = 0; j < image_w; j++){
      for (let h = 0; h < tile_h; h++){
        for(let w = 0; w < tile_w; w++){
          // if (h === 0 && (w === tile_w-1)){
          if (h === tile_h-1){
            // // Draw the pixel darker on the right bottom of the tile.
            let sum = image_in[(i*image_w+j)*4 + 0] + image_in[(i*image_w+j)*4 + 1] + image_in[(i*image_w+j)*4 + 2];
            image.data[((i*image_w*tile_h + j + h*image_w)*tile_w + w)*4 + 0] = image_in[(i*image_w+j)*4 + 0];
            image.data[((i*image_w*tile_h + j + h*image_w)*tile_w + w)*4 + 1] = image_in[(i*image_w+j)*4 + 1];
            image.data[((i*image_w*tile_h + j + h*image_w)*tile_w + w)*4 + 2] = image_in[(i*image_w+j)*4 + 2];
            image.data[((i*image_w*tile_h + j + h*image_w)*tile_w + w)*4 + 3] = (sum === 0) ? 0xFF : 0x88;
          }
          else{
            image.data[((i*image_w*tile_h + j + h*image_w)*tile_w + w)*4 + 0] = image_in[(i*image_w+j)*4 + 0];
            image.data[((i*image_w*tile_h + j + h*image_w)*tile_w + w)*4 + 1] = image_in[(i*image_w+j)*4 + 1];
            image.data[((i*image_w*tile_h + j + h*image_w)*tile_w + w)*4 + 2] = image_in[(i*image_w+j)*4 + 2];
            image.data[((i*image_w*tile_h + j + h*image_w)*tile_w + w)*4 + 3] = image_in[(i*image_w+j)*4 + 3];
          }
        }
      }
    }
  }
  return image;
}

function drawImageWithTile(image_w, image_h, tile_w, tile_h, image_in){
  let image = ctx.createImageData(image_w * tile_w, image_h * tile_h);
  for (let i = 0; i < image_h; i++){
    for (let j = 0; j < image_w; j++){
      for (let h = 0; h < tile_h; h++){
        for(let w = 0; w < tile_w; w++){
          image.data[((i*image_w*tile_h + j + h*image_w)*tile_w + w)*4 + 0] = image_in[(i*image_w+j)*4 + 0];
          image.data[((i*image_w*tile_h + j + h*image_w)*tile_w + w)*4 + 1] = image_in[(i*image_w+j)*4 + 1];
          image.data[((i*image_w*tile_h + j + h*image_w)*tile_w + w)*4 + 2] = image_in[(i*image_w+j)*4 + 2];
          image.data[((i*image_w*tile_h + j + h*image_w)*tile_w + w)*4 + 3] = image_in[(i*image_w+j)*4 + 3];
        }
      }
    }
  }
  return image;
}

function init(){
  // init
}
