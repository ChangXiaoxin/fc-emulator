
const vscode = acquireVsCodeApi();
const cvs = document.getElementById('cvs');
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
const GAME_TILE_X = 4;
const GAME_TILE_Y = 4;
const PALETTE_TABLE_X = 520;
const PALETTE_TABLE_Y = 250;
const PALETTE_TABLE_TILE_X = 2;
const PALETTE_TABLE_TILE_Y = 2;

const NAME_TABLE_X = 1070;
const NAME_TABLE_Y = GAME_Y;

const OAM_X = NAME_TABLE_X;
const OAM_Y = NAME_TABLE_Y + 20 + 240*2;

const DATE_INFO_X = 0;
const DATE_INFO_Y = 12;

cvs.width =(256 * GAME_TILE_X);
cvs.height = (240 * GAME_TILE_Y) + 45 + 24;

let frameRate = new Array(31).fill(0);
let timeDiff = new Array(31).fill(0);

function insertFrame(frame){
  frameRate[30]-=frameRate[0];
  for(let i = 0; i < 29; i++){
    frameRate[i] = frameRate[i+1];
  }
  frameRate[29] = frame;
  frameRate[30] += frame;
}

function insertTimeDiff(diff){
  timeDiff[30]-=timeDiff[0];
  for(let i = 0; i < 29; i++){
    timeDiff[i] = timeDiff[i+1];
  }
  timeDiff[29] = diff;
  timeDiff[30] += diff;
}

const DISPLAY_CANVAS_RANGE = false;

window.addEventListener('load', init);
document.addEventListener("keydown", event =>{
  vscode.postMessage({keypressed: event.code});
});
document.addEventListener("keyup", event =>{
  vscode.postMessage({keyreleased: event.code});
});
window.addEventListener("message", event =>{
  const message = event.data;
  handleGameVideo(message.imageData);
  // handleCPURunLog(message.CPULOG);
  // handleColorPalettes(message.ColorPalettes);
  // handlePalettes(message.Palettes);
  // handlePatternImage(message.patternImage);
  // handlePatternImage2(message.patternImage2);
  // handleNameTable(message.nameTable);
  // handleControllerInput(message.controllerInput);
  // handleOAMData(message.oamData);
  handleDateInfo(message.dateInfo);
});

function handleDateInfo(dateInfo){
  if (dateInfo){
    insertFrame(dateInfo[1]);
    insertTimeDiff(dateInfo[0]);
    ctx.clearRect(DATE_INFO_X, DATE_INFO_Y-12, 120, 30);
    ctx.font = "12px Courier New";
    ctx.fillStyle = "white";
    ctx.fillText((timeDiff[30]/30).toFixed(2), DATE_INFO_X, DATE_INFO_Y);
    ctx.fillText((frameRate[30]/30).toFixed(2), DATE_INFO_X, DATE_INFO_Y + 12);
  }
}

function handleGameVideo(imageData){
  if (imageData){
    let imgData = drawImageWithTileCRT(256, 240, GAME_TILE_X, GAME_TILE_Y, imageData);
    ctx.putImageData(imgData, GAME_X, GAME_Y);
  }
}

function handleCPURunLog(cpulog){
  if (cpulog){
    ctx.clearRect(LOG_X, LOG_Y + 20, 550, 220);
    ctx.fillStyle = "green";
    ctx.fillRect(LOG_X + 20, LOG_Y + 228 - 15, 350, 18);
    ctx.font = "20px Courier New";
    ctx.fillStyle = "white";
    ctx.fillText(cpulog[LOG_SIZE], LOG_X, LOG_Y + 40);
    ctx.font = "16px Courier New";
    for (let i = 0; i < LOG_SIZE; i++){
      ctx.fillText(cpulog[i], LOG_X + 20, LOG_Y + 80 - 15 + 18*i);
    }
  }
}

function handleColorPalettes(ColorPalettes){
  if (ColorPalettes){
    if(DISPLAY_CANVAS_RANGE){
      ctx.fillStyle = "red";
      ctx.fillRect(0, 0, cvs.width, cvs.height);
    }
    let paletteImage = ctx.createImageData(COLOR_PALETTE_WIDTH * 16, COLOR_PALETTE_HEIGTH * 4);
    for (let i = 0; i < 4; i++){
      for (let j = 0; j < 16; j++){
        for (let h = 0; h < COLOR_PALETTE_HEIGTH; h++){
          for(let w = 0; w < COLOR_PALETTE_WIDTH; w++){
            let edge = (h === 0) || (w === 0) || (h === (COLOR_PALETTE_HEIGTH-1)) || (w === (COLOR_PALETTE_WIDTH-1));
            let paletteIndex = ((i*16*COLOR_PALETTE_HEIGTH + j + h*16)*COLOR_PALETTE_WIDTH + w)*4;
            let colorIndex = (i*16+j)*4;
            paletteImage.data[paletteIndex + 0] = edge ? 0 : ColorPalettes[colorIndex + 0];
            paletteImage.data[paletteIndex + 1] = edge ? 0 : ColorPalettes[colorIndex + 1];
            paletteImage.data[paletteIndex + 2] = edge ? 0 : ColorPalettes[colorIndex + 2];
            paletteImage.data[paletteIndex + 3] = edge ? 0 : ColorPalettes[colorIndex + 3];
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
}

function handlePalettes(Palettes){
  if (Palettes){
    let paletteImage = ctx.createImageData(PALETTE_RAM_WIDTH * 16, PALETTE_RAM_HEIGTH * 2);
    let border = 0x00;
    for (let i = 0; i < 2; i++){
      for (let j = 0; j < 16; j++){
        let colorIndex = (i*16+j)*4;
        if(((i * 16 + j)/4 >= Palettes[16*2*4]) && ((i * 16 + j)/4 < (Palettes[16*2*4]+1))){
          border = 0xCF;
        }
        else{
          border = 0x00;
        }
        for (let h = 0; h < PALETTE_RAM_HEIGTH; h++){
          for(let w = 0; w < PALETTE_RAM_WIDTH; w++){
            let edge = (h === 0) || (w === 0) || (h === (PALETTE_RAM_HEIGTH-1)) || (w === (PALETTE_RAM_WIDTH-1));
            let paletteIndex = ((i*16*PALETTE_RAM_HEIGTH + j + h*16)*PALETTE_RAM_WIDTH + w)*4;
            paletteImage.data[paletteIndex + 0] = edge ? 0      : Palettes[colorIndex + 0];
            paletteImage.data[paletteIndex + 1] = edge ? border : Palettes[colorIndex + 1];
            paletteImage.data[paletteIndex + 2] = edge ? 0      : Palettes[colorIndex + 2];
            paletteImage.data[paletteIndex + 3] = edge ? border : Palettes[colorIndex + 3];
          }
        }
      }
    }
    ctx.clearRect(PALETTE_RAM_X, PALETTE_RAM_Y + 5, 30 + PALETTE_RAM_WIDTH*17, PALETTE_RAM_HEIGTH);
    ctx.clearRect(PALETTE_RAM_X, PALETTE_RAM_Y + PALETTE_RAM_HEIGTH, 35, PALETTE_RAM_HEIGTH * 2);
    ctx.font = "11px Courier New";
    ctx.fillStyle = "white";
    for (let i = 0; i < 16; i++){
      ctx.fillText("$0"+ i.toString(16).toUpperCase(), PALETTE_RAM_X + 40 + PALETTE_RAM_WIDTH*i, PALETTE_RAM_Y + PALETTE_RAM_HEIGTH);
    }
    ctx.fillText("$3F00", PALETTE_RAM_X, PALETTE_RAM_Y + PALETTE_RAM_HEIGTH + 25);
    ctx.fillText("$3F10", PALETTE_RAM_X, PALETTE_RAM_Y + PALETTE_RAM_HEIGTH + 25 + PALETTE_RAM_HEIGTH);
    ctx.putImageData(paletteImage, PALETTE_RAM_X + 40, PALETTE_RAM_Y + PALETTE_RAM_HEIGTH + 10);
  }
}

function handlePatternImage(patternImage) {
  if (patternImage){
    let paletteImage = drawImageWithTileCRT(16*8, 16*8, PALETTE_TABLE_TILE_X, PALETTE_TABLE_TILE_Y, patternImage);
    ctx.clearRect(PALETTE_TABLE_X, PALETTE_TABLE_Y - 10, 120, 12);
    ctx.font = "12px Courier New";
    ctx.fillStyle = "white";
    ctx.fillText("Pattern Table 0", PALETTE_TABLE_X, PALETTE_TABLE_Y);
    ctx.putImageData(paletteImage,PALETTE_TABLE_X, PALETTE_TABLE_Y + 5);
  }
}

function handlePatternImage2(patternImage2) {
  if (patternImage2){
    let paletteImage = drawImageWithTileCRT(16*8, 16*8, PALETTE_TABLE_TILE_X, PALETTE_TABLE_TILE_Y, patternImage2);
    ctx.clearRect(PALETTE_TABLE_X + 16*8*PALETTE_TABLE_TILE_X + 20, PALETTE_TABLE_Y - 10, 120, 12);
    ctx.font = "12px Courier New";
    ctx.fillStyle = "white";
    ctx.fillText("Pattern Table 1", PALETTE_TABLE_X + 16*8*PALETTE_TABLE_TILE_X + 20, PALETTE_TABLE_Y);
    ctx.putImageData(paletteImage, PALETTE_TABLE_X + 16*8*PALETTE_TABLE_TILE_X + 20, PALETTE_TABLE_Y + 5);
  }
}

function handleNameTable(nameTable) {
  if (nameTable){
    let paletteImage = drawImageWithTile(256, 240, 1, 1, nameTable);
    switch (nameTable[256*240*4]){
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
}

function handleControllerInput(controllerInput) {
  if (controllerInput){
    ctx.clearRect(PALETTE_TABLE_X + 120 + (controllerInput[0]-1) * (16*8*PALETTE_TABLE_TILE_X + 20), PALETTE_TABLE_Y - 10, 120, 12);
    ctx.font = "12px Courier New";
    ctx.fillStyle = "white";
    ctx.fillText(controllerInput[1].toString(2), PALETTE_TABLE_X + 120 + (controllerInput[0]-1) * (16*8*PALETTE_TABLE_TILE_X + 20), PALETTE_TABLE_Y);
  }
}

function handleOAMData(oamData) {
  if (oamData){
    let x = 0;
    let y = 0;
    ctx.clearRect(OAM_X, OAM_Y-12, 512, 220);
    ctx.font = "12px Courier New";
    ctx.fillStyle = "white";
    ctx.fillText("   |x   y   id  at  |x   y   id  at  |x   y   id  at  |x   y   id  at  ", OAM_X, OAM_Y);
    ctx.fillText("---+----------------+----------------+----------------+----------------", OAM_X, OAM_Y+12);
    for (let index = 0; index < 64*4; index+=4) {
      if (x > 3){
        x = 0;
        y++;
      }
      if (y > 64/4){
        y = 0;
      }
      if (x===0){
        ctx.fillText((index>>2).toString(), OAM_X, OAM_Y + 12*(y+2));
      }
      ctx.fillText('|'+oamData[index + 3].toString(), OAM_X + 122*x + 22  , OAM_Y + 12*(y+2));
      ctx.fillText(    oamData[index + 0].toString(), OAM_X + 122*x + 58  , OAM_Y + 12*(y+2));
      ctx.fillText(    oamData[index + 1].toString(), OAM_X + 122*x + 87  , OAM_Y + 12*(y+2));
      ctx.fillText(    oamData[index + 2].toString(), OAM_X + 122*x + 116 , OAM_Y + 12*(y+2));
      x++;
    }
  }
}

function drawImageWithTileCRT(image_w, image_h, tile_w, tile_h, image_in){
  let image = ctx.createImageData(image_w * tile_w, image_h * tile_h);
  for (let i = 0; i < image_h; i++){
    for (let j = 0; j < image_w; j++){
      let imageInIndex = (i*image_w+j)*4;
      for (let h = 0; h < tile_h; h++){
        for(let w = 0; w < tile_w; w++){
          // if (h === 0 && (w === tile_w-1)){
          let imageIndex = ((i*image_w*tile_h + j + h*image_w)*tile_w + w)*4;
          if (h === tile_h-1){
            // // Draw the pixel darker on the right bottom of the tile.
            // let sum = image_in[imageInIndex + 0] + image_in[imageInIndex + 1] + image_in[imageInIndex + 2];
            image.data[imageIndex + 0] = image_in[imageInIndex + 0];
            image.data[imageIndex + 1] = image_in[imageInIndex + 1];
            image.data[imageIndex + 2] = image_in[imageInIndex + 2];
            // image.data[imageIndex + 3] = (sum === 0) ? 0xFF : 0x88;
            image.data[imageIndex + 3] = 0x8F;
          }
          else{
            image.data[imageIndex + 0] = image_in[imageInIndex + 0];
            image.data[imageIndex + 1] = image_in[imageInIndex + 1];
            image.data[imageIndex + 2] = image_in[imageInIndex + 2];
            image.data[imageIndex + 3] = image_in[imageInIndex + 3];
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
      let imageInIndex = (i*image_w+j)*4;
      for (let h = 0; h < tile_h; h++){
        for(let w = 0; w < tile_w; w++){
          let imageIndex = ((i*image_w*tile_h + j + h*image_w)*tile_w + w)*4;
          image.data[imageIndex + 0] = image_in[imageInIndex + 0];
          image.data[imageIndex + 1] = image_in[imageInIndex + 1];
          image.data[imageIndex + 2] = image_in[imageInIndex + 2];
          image.data[imageIndex + 3] = image_in[imageInIndex + 3];
        }
      }
    }
  }
  return image;
}

function init(){
  // init
}
