import * as fs from 'fs';
import { IBus } from './Bus';
import { uint16, uint8 } from './typedef';
import { Regs } from '../FC/CPU2A03';
import { drawColorPalettes, drawLogs, drawNameTables, drawOAMData, drawPalettes, drawPatternTables } from '../FC/display';
import { LOOPYREG, PPUReg } from '../FC/PPU2C02';

const LOG_SIZE = 10;
export interface LOGS {
  PC: string;
  opCode: string;
  opName: string;
  dataCode: string;
  addrMode: ADDR_MODE;
  address: uint16;
  dataContent: string;
  A: string;
  X: string;
  Y: string;
  P: string;
  SP: string;
  PPU: string;
  CYC: string;
};

export enum ADDR_MODE {
  IMP,
  IMM,
  ABS,
  ABY,
  ABX,
  ZP,
  ZPX,
  ZPY,
  IZX,
  IZY,
  IND,
  REL,
};

// Debug log
export var logTemplate = (
  logs:LOGS
) =>
`${logs.PC}  ${logs.opCode} ${logs.dataCode}` + " ".padStart(10-logs.dataCode.length-logs.opName.length) +
`${logs.opName} ${logs.dataContent}` + " ".padStart(28-logs.dataContent.length) +
`A:${logs.A} X:${logs.X} Y:${logs.Y} P:${logs.P} SP:${logs.SP} PPU:${logs.PPU}` +
" ".padStart(8-logs.PPU.length) + `CYC:${logs.CYC}
`;

// reg log
export let regsTemplate = (
  logs:LOGS
) =>
`PC:${logs.PC} A:${logs.A} X:${logs.X} Y:${logs.Y} P:${logs.P} SP:${logs.SP} @${logs.CYC}`;
export let opcodeTemplate = (
  logs:LOGS
) =>
`${logs.PC}  ${logs.opCode} ${logs.dataCode}` + " ".padStart(10-logs.dataCode.length-logs.opName.length) +
`${logs.opName} ${logs.dataContent}`;

export function zeroFill(str: string, num: number): string{
  return str.padStart(num, "0");  
}
let logpath = "";
let cpulog:LOGS = {
  PC: '',
  opCode: '',
  opName: '',
  dataCode: '',
  dataContent: '',
  address: 0x00,
  addrMode: ADDR_MODE.IMP,
  A: '',
  X: '',
  Y: '',
  P: '',
  SP: '',
  PPU: '',
  CYC: ''
};

let logs: string[] = new Array(LOG_SIZE + 1).fill("----  -- -- --  --- ----");

function debugResetCUPLog(){
  cpulog = {
    PC: '',
    opCode: '',
    opName: '',
    dataCode: '',
    dataContent: '',
    address: 0x00,
    addrMode: ADDR_MODE.IMP,
    A: '',
    X: '',
    Y: '',
    P: '',
    SP: '',
    PPU: '',
    CYC: ''
  };
}

let ppubus: IBus;
let cpubus: IBus;
export function debugCatchCPUBus(bus: IBus){
  cpubus = bus;
}
export function debugCatchPPUBus(bus: IBus){
  ppubus = bus;
}
let cpuregs: Regs;
export function debugCatchCPURegs(regs: Regs){
  cpuregs = regs;
}

export function debugCatchRegs()
{
  cpulog.PC  = zeroFill(cpuregs.PC.toString(16).toUpperCase(), 4);
  cpulog.A   = zeroFill(cpuregs.A.toString(16).toUpperCase(), 2);
  cpulog.X   = zeroFill(cpuregs.X.toString(16).toUpperCase(), 2);
  cpulog.Y   = zeroFill(cpuregs.Y.toString(16).toUpperCase(), 2);
  cpulog.P   = zeroFill(cpuregs.P.toString(16).toUpperCase(), 2);
  cpulog.SP  = zeroFill(cpuregs.S.toString(16).toUpperCase(), 2);
}

export function debugCatchClocks(cpuClocks: any)
{
  cpulog.CYC = cpuClocks.toString();
}

export function debugCatchOpCode(opCode: any)
{
  cpulog.opCode = zeroFill(opCode.toString(16).toUpperCase(), 2);
}
export function debugCatchExtendedDataContent(){
  if ((cpulog.addrMode === ADDR_MODE.IMP) &&
           (cpulog.opName === "LSR" || cpulog.opName === "ASL" ||
            cpulog.opName === "ROR" || cpulog.opName === "ROL"
           )){
    cpulog.dataContent += "A";
  }
  else if (cpulog.addrMode === ADDR_MODE.ABS) {
    if (cpulog.opName === "JMP" || cpulog.opName === "JSR"){
    }
    else{
      cpulog.addrMode = ADDR_MODE.IMM;  // Make sure only extend data content once.
      cpulog.dataContent += " = " + zeroFill(((cpulog.address>0x2000) && (cpulog.address<0x4100))? "--": (cpubus.readByte(cpulog.address)).toString(16).toUpperCase(), 2);
    }
  }
  if (cpulog.opName === "SBC" && cpulog.opCode === "EB"){
    cpulog.opName = "*SBC";
  }
}
export function debugCatchDataCode(address: uint16, addrMode: ADDR_MODE)
{
  if (address > 0xFF){
    cpulog.dataCode = zeroFill((address&0xFF).toString(16).toUpperCase(), 2) + " "
                    + zeroFill(((address>>8)&0xFF).toString(16).toUpperCase(), 2);
  }
  else if (address >= 0x00){
    cpulog.dataCode = zeroFill(address.toString(16).toUpperCase(), 2);
  }
  else{
    cpulog.dataCode = "";
  }
  switch (addrMode){
    case ADDR_MODE.IMM:
      cpulog.dataContent = "#$" + zeroFill((address&0xFF).toString(16).toUpperCase(), 2);
      break;
    case ADDR_MODE.ABS:
      cpulog.dataContent = "$" + zeroFill(((address>>8)&0xFF).toString(16).toUpperCase(), 2)
                               + zeroFill((address&0xFF).toString(16).toUpperCase(), 2);
      break;
    case ADDR_MODE.ABY:
      const peekedaby = cpubus.readWord(cpuregs.PC-2);
      cpulog.dataCode = zeroFill((peekedaby&0xFF).toString(16).toUpperCase(), 2) + " "
                      + zeroFill(((peekedaby>>8)&0xFF).toString(16).toUpperCase(), 2);;
      cpulog.dataContent = "$" + zeroFill((peekedaby).toString(16).toUpperCase(), 4) + ",Y @ "
                         + zeroFill((address).toString(16).toUpperCase(), 4) + " = "
                         + zeroFill(((address>0x2000) && (address<0x4100))? "--": (cpubus.readByte(address)).toString(16).toUpperCase(), 2);
      break;
    case ADDR_MODE.ABX:
      const peekedabx = cpubus.readWord(cpuregs.PC-2);
      cpulog.dataCode = zeroFill((peekedabx&0xFF).toString(16).toUpperCase(), 2) + " "
                      + zeroFill(((peekedabx>>8)&0xFF).toString(16).toUpperCase(), 2);;
      cpulog.dataContent = "$" + zeroFill((peekedabx).toString(16).toUpperCase(), 4) + ",X @ "
                         + zeroFill((address).toString(16).toUpperCase(), 4) + " = "
                         + zeroFill(((address>0x2000) && (address<0x4100))? "--": (cpubus.readByte(address)).toString(16).toUpperCase(), 2);
      break;
    case ADDR_MODE.REL:
      if (address & 0x80){
        address = -complement(address);
      }
      const branch = cpuregs.PC + address;
      cpulog.dataContent = "$" + zeroFill(((branch>>8)&0xFF).toString(16).toUpperCase(), 2)
                               + zeroFill((branch&0xFF).toString(16).toUpperCase(), 2);
      break;
    case ADDR_MODE.ZP:
      cpulog.dataContent = "$" + zeroFill((address&0xFF).toString(16).toUpperCase(), 2) + " = "
                         + zeroFill(((address>0x2000) && (address<0x4100))? "--": (cpubus.readByte(address)).toString(16).toUpperCase(), 2);
      break;
    case ADDR_MODE.ZPX:
      const peekedzpx = cpubus.readByte(cpuregs.PC-1);
      cpulog.dataCode = zeroFill(peekedzpx.toString(16).toUpperCase(), 2);
      cpulog.dataContent = "$" + zeroFill(peekedzpx.toString(16).toUpperCase(), 2) + ",X @ "
                         + zeroFill((address).toString(16).toUpperCase(), 2) + " = "
                         + zeroFill(((address>0x2000) && (address<0x4100))? "--": (cpubus.readByte(address)).toString(16).toUpperCase(), 2);
      break;
    case ADDR_MODE.ZPY:
      const peekedzpy = cpubus.readByte(cpuregs.PC-1);
      cpulog.dataCode = zeroFill(peekedzpy.toString(16).toUpperCase(), 2);
      cpulog.dataContent = "$" + zeroFill(peekedzpy.toString(16).toUpperCase(), 2) + ",Y @ "
                         + zeroFill((address).toString(16).toUpperCase(), 2) + " = "
                         + zeroFill(((address>0x2000) && (address<0x4100))? "--": (cpubus.readByte(address)).toString(16).toUpperCase(), 2);
      break;
    case ADDR_MODE.IZX:
      const peeked = cpubus.readByte(cpuregs.PC-1);
      const peekedStr = zeroFill((peeked).toString(16).toUpperCase(), 2);
      cpulog.dataCode = peekedStr;
      cpulog.dataContent = "($" + peekedStr + ",X) @ "
                         + zeroFill(((peeked + cpuregs.X) & 0xFF).toString(16).toUpperCase(), 2) + " = "
                         + zeroFill((address).toString(16).toUpperCase(), 4) + " = "
                         + zeroFill(((address>0x2000) && (address<0x4100))? "--": (cpubus.readByte(address)).toString(16).toUpperCase(), 2);
      break;
    case ADDR_MODE.IZY:
      const peekedy = cpubus.readByte(cpuregs.PC-1);
      const peeked2 = cpubus.readByte(peekedy);
      const peeked3 = cpubus.readByte((peekedy + 1) & 0xFF) << 8;
      const peekedyStr = zeroFill((peekedy).toString(16).toUpperCase(), 2);
      cpulog.dataCode = peekedyStr;
      cpulog.dataContent = "($" + peekedyStr + "),Y = "
                         + zeroFill((peeked2 | peeked3).toString(16).toUpperCase(), 4) + " @ "
                         + zeroFill((address).toString(16).toUpperCase(), 4) + " = "
                         + zeroFill(((address>0x2000) && (address<0x4100))? "--": (cpubus.readByte(address)).toString(16).toUpperCase(), 2);
      break;
    case ADDR_MODE.IND:
      let regspc = 0xFFFF;
      if(!((address>0x2000) && (address<0x4100))){
        if ((address & 0x00FF) === 0x00FF){
          const address2 = address & 0xFF00;
          regspc = (cpubus.readByte(address2) << 8) | (cpubus.readByte(address)) & 0xFFFF;
        }
        else{
          regspc = cpubus.readWord(address);
        }
      }
      const peekedindStr = zeroFill((address).toString(16).toUpperCase(), 4);
      cpulog.dataCode = zeroFill((address&0xFF).toString(16).toUpperCase(), 2) + " "
                      + zeroFill(((address>>8)&0xFF).toString(16).toUpperCase(), 2);
      cpulog.dataContent = "($" + peekedindStr + ") = "
                         + zeroFill(regspc.toString(16).toUpperCase(), 4);
      break;
    default:
      break;
  }
  cpulog.addrMode = addrMode;
  cpulog.address = address;
}

function complement(value: any){
  return (~value & 0xFF) + 1;
}
export function debugCatchOpName(opName: any)
{
  cpulog.opName = opName;
  debugCatchExtendedDataContent();
}

export function debugCatchToLogFile(){
  let logContent = logTemplate(cpulog);
  fs.appendFileSync(logpath, logContent);
  // debugResetCUPLog();
}

export function debugCatchToLogs(){
  logs[LOG_SIZE] = regsTemplate(cpulog);
  for(let i = 0; i < LOG_SIZE-1; i++){
    logs[i] = logs[i+1];
  }
  logs[LOG_SIZE-1] = opcodeTemplate(cpulog);
  debugResetCUPLog();
}

export function debugCatchDrawLog(){
  drawLogs(logs);
}

export function debugCatchLogPath(path: string){
  logpath = path;
}

export function debugCatchDrawColorTable(ColorPalettes: any){
  let palettes = new Uint8Array(16*4*4).fill(0);
  for (let i = 0; i < palettes.length; i+=4){
    palettes[i+0] = 0xFF & (ColorPalettes[i/4]>>16);
    palettes[i+1] = 0xFF & (ColorPalettes[i/4]>>8 );
    palettes[i+2] = 0xFF & (ColorPalettes[i/4]>>0 );
    palettes[i+3] = 0xFF;
  }
  drawColorPalettes(palettes);
}

export function debugCatchDrawPatternTables(ColorPalettes: any, index: uint8, palettesIndex: uint8){
  let patternTable = new Uint8Array(16*16*8*8).fill(0);
  for (let i = 0; i < 16; i++){
    for (let j = 0; j < 16; j++){
      // Tiles
      for (let h = 0; h < 8; h++){
        let tileMSB = ppubus.readByte((index<<12) | ((i*16 + j)*16 + h + 8));
        let tileLSB = ppubus.readByte((index<<12) | ((i*16 + j)*16 + h));
        for (let w = 0; w < 8; w++){
          patternTable[(i*16*8*8 + j*8) + h*16*8 + w] = 0x3F & ppubus.readByte(0x3F00 + palettesIndex*4 + ((tileMSB >> 7 & 0x01) << 1) + ((tileLSB >> 7) & 0x01));
          tileMSB = tileMSB << 1;
          tileLSB = tileLSB << 1;
        }
      }
    }
  }
  let patternImage = new Uint8Array(16*16*8*8*4).fill(0);
  for (let i = 0; i < patternImage.length; i+=4){
    patternImage[i + 0] = 0xFF & (ColorPalettes[(patternTable[i/4])]>>16);
    patternImage[i + 1] = 0xFF & (ColorPalettes[(patternTable[i/4])]>>8 );
    patternImage[i + 2] = 0xFF & (ColorPalettes[(patternTable[i/4])]>>0 );
    patternImage[i + 3] = 0xFF;
  }
  drawPatternTables(patternImage, index);
}

export function debugCatchDrawNameTables(ColorPalettes: any, nametableY: uint8, nametableX: uint8, loopyreg: LOOPYREG, fineX: uint8){
  let nameTableImage = new Uint8Array(256*240*4 + 1).fill(0);

  for (let scanline = 0; scanline < 240; scanline++){
    for (let cycles = 0; cycles < 256; cycles++){
      let coarseX = cycles>>3;
      let coarseY = scanline>>3;
      let fine_x = cycles%8;
      let fine_y = scanline%8;
      let loopy =  (fine_y<<12) | (nametableY<<11) | (nametableX<<10) | (coarseY<<5) | (coarseX);
      let tile = ppubus.readByte(0x2000 | (loopy & 0x0FFF)) + 16*16;
      // let tile = ppubus.readByte(0x2000 | (loopy & 0x0FFF));
      let tileMSB = ppubus.readByte(tile*16 + fine_y + 8);
      let tileLSB = ppubus.readByte(tile*16 + fine_y);
      let bgTileAttrbi = ppubus.readByte(0x23C0 | (nametableY << 11)
                                                | (nametableX << 10)
                                                | ((coarseY >> 2) << 3)
                                                | (coarseX >> 2));
      if ((coarseY & 0x02) > 0){
        bgTileAttrbi >>= 4;
      }
      if ((coarseX & 0x02) > 0){
        bgTileAttrbi >>= 2;
      }
      bgTileAttrbi &= 0x03;
      let colorIndex = 0x3F & ppubus.readByte(0x3F00 + bgTileAttrbi*4 + ((tileMSB >> (7 - fine_x) & 0x01) << 1) + ((tileLSB >> (7 - fine_x)) & 0x01));
      let imageIndex = (scanline*256 + cycles)*4;
      nameTableImage[imageIndex + 0] = 0xFF & (ColorPalettes[colorIndex]>>16);
      nameTableImage[imageIndex + 1] = 0xFF & (ColorPalettes[colorIndex]>>8);
      nameTableImage[imageIndex + 2] = 0xFF & (ColorPalettes[colorIndex]>>0);
      nameTableImage[imageIndex + 3] = 0xFF;
    }
  }


  //      tileLU ◸-----------◹ tileRU
  //             |            |
  //             |   Screen   |
  //             |            |
  //      tileLD ◺-----------◿ tileRD
  let scanlineY = loopyreg.coarseY*8 + loopyreg.fineY;
  let cyclesX = loopyreg.coarseX*8 + fineX;
  // tileLU
  if ((loopyreg.nametableX === nametableX) && (loopyreg.nametableY === nametableY)){
    let cycles = cyclesX;
    for(cycles; cycles < 256; cycles++){
      let imageIndex = (scanlineY*256 + cycles)*4;
      nameTableImage[imageIndex + 0] = 0xFF;
      nameTableImage[imageIndex + 1] = 0x00;
      nameTableImage[imageIndex + 2] = 0x00;
      nameTableImage[imageIndex + 3] = 0xAF;
    }
    let scanline = scanlineY;
    for(scanline; scanline < 240; scanline++){
      let imageIndex = (scanline*256 + cyclesX)*4;
      nameTableImage[imageIndex + 0] = 0xFF;
      nameTableImage[imageIndex + 1] = 0x00;
      nameTableImage[imageIndex + 2] = 0x00;
      nameTableImage[imageIndex + 3] = 0xAF;
    }
  }

  // tileRU
  if ((loopyreg.nametableX !== nametableX) && (loopyreg.nametableY === nametableY)){
    let scanline = scanlineY;
    for(scanline; scanline < 256; scanline++){
      let imageIndex = (scanline*256 + cyclesX)*4;
      nameTableImage[imageIndex + 0] = 0xFF;
      nameTableImage[imageIndex + 1] = 0x00;
      nameTableImage[imageIndex + 2] = 0x00;
      nameTableImage[imageIndex + 3] = 0xAF;
    }
    let cycles = 0;
    for(cycles; cycles < cyclesX; cycles++){
      let imageIndex = (scanlineY*256 + cycles)*4;
      nameTableImage[imageIndex + 0] = 0xFF;
      nameTableImage[imageIndex + 1] = 0x00;
      nameTableImage[imageIndex + 2] = 0x00;
      nameTableImage[imageIndex + 3] = 0xAF;
    }
  }

  // tileLD
  if ((loopyreg.nametableX === nametableX) && (loopyreg.nametableY !== nametableY)){
    let scanline = 0;
    for(scanline; scanline < scanlineY; scanline++){
      let imageIndex = (scanline*256 + cyclesX)*4;
      nameTableImage[imageIndex + 0] = 0xFF;
      nameTableImage[imageIndex + 1] = 0x00;
      nameTableImage[imageIndex + 2] = 0x00;
      nameTableImage[imageIndex + 3] = 0xAF;
    }
    let cycles = cyclesX;
    for(cycles; cycles < 256; cycles++){
      let imageIndex = (scanlineY*256 + cycles)*4;
      nameTableImage[imageIndex + 0] = 0xFF;
      nameTableImage[imageIndex + 1] = 0x00;
      nameTableImage[imageIndex + 2] = 0x00;
      nameTableImage[imageIndex + 3] = 0xAF;
    }
  }

  // tileRD
  if (loopyreg.nametableX !== nametableX && loopyreg.nametableY !== nametableY){
    let cycles = 0;
    for(cycles; cycles < cyclesX; cycles++){
      let imageIndex = (scanlineY*256 + cycles)*4;
      nameTableImage[imageIndex + 0] = 0xFF;
      nameTableImage[imageIndex + 1] = 0x00;
      nameTableImage[imageIndex + 2] = 0x00;
      nameTableImage[imageIndex + 3] = 0xAF;
    }
    let scanline = 0;
    for(scanline; scanline < scanlineY; scanline++){
      let imageIndex = (scanline*256 + cyclesX)*4;
      nameTableImage[imageIndex + 0] = 0xFF;
      nameTableImage[imageIndex + 1] = 0x00;
      nameTableImage[imageIndex + 2] = 0x00;
      nameTableImage[imageIndex + 3] = 0xAF;
    }
  }
  nameTableImage[256*240*4] = (nametableY<<1) + nametableX;
  drawNameTables(nameTableImage);
}
export function debugCatchDrawPalette(Palettes: any, index: uint8){
  let palettes = new Uint8Array(32*4 + 1).fill(0);
  for (let i = 0; i < palettes.length; i+=4){
    let colorIndex = 0x3F & ppubus.readByte(0x3F00 + i/4);
    palettes[i + 0] = 0xFF & (Palettes[colorIndex]>>16);
    palettes[i + 1] = 0xFF & (Palettes[colorIndex]>>8 );
    palettes[i + 2] = 0xFF & (Palettes[colorIndex]>>0 );
    palettes[i + 3] = 0xFF;
  }
  palettes[32*4] = index;
  drawPalettes(palettes);
}

export function debugCatchOAMData(OAMdata: Uint8Array) {
  drawOAMData(OAMdata);
}

export function copyLoopyReg(dst:LOOPYREG, src:LOOPYREG){
  dst.nametableX = src.nametableX;
  dst.nametableY = src.nametableY;
  dst.coarseX = src.coarseX;
  dst.coarseY = src.coarseY;
  dst.fineY = src.fineY;
}
