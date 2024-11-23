import * as fs from 'fs';
import { IBus } from './Bus';
import { IRegs } from './CPU';
import { uint16 } from './typedef';
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

export function zeroFill(str: string, num: number): string{
  return str.padStart(num, "0");  
}
var cpulog:LOGS = {
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

function debugRestCUPLog(){
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

var cpubus: IBus;
export function debugCatchCPUBus(bus: IBus){
  cpubus = bus;
}
var cpuregs: IRegs;
export function debugCatchCPURegs(regs: IRegs){
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
      cpulog.dataContent += " = " + zeroFill((cpubus.readByte(cpulog.address)).toString(16).toUpperCase(), 2);
    }
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
                         + zeroFill((cpubus.readByte(address)).toString(16).toUpperCase(), 2);
      break;
    case ADDR_MODE.ABX:
      const peekedabx = cpubus.readWord(cpuregs.PC-2);
      cpulog.dataCode = zeroFill((peekedabx&0xFF).toString(16).toUpperCase(), 2) + " "
                      + zeroFill(((peekedabx>>8)&0xFF).toString(16).toUpperCase(), 2);;
      cpulog.dataContent = "$" + zeroFill((peekedabx).toString(16).toUpperCase(), 4) + ",X @ "
                         + zeroFill((address).toString(16).toUpperCase(), 4) + " = "
                         + zeroFill((cpubus.readByte(address)).toString(16).toUpperCase(), 2);
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
                         + zeroFill((cpubus.readByte(address)).toString(16).toUpperCase(), 2);
      break;
    case ADDR_MODE.ZPX:
      const peekedzpx = cpubus.readByte(cpuregs.PC-1);
      cpulog.dataCode = zeroFill(peekedzpx.toString(16).toUpperCase(), 2);
      cpulog.dataContent = "$" + zeroFill(peekedzpx.toString(16).toUpperCase(), 2) + ",X @ "
                         + zeroFill((address).toString(16).toUpperCase(), 2) + " = "
                         + zeroFill((cpubus.readByte(address)).toString(16).toUpperCase(), 2);
      break;
    case ADDR_MODE.ZPY:
      const peekedzpy = cpubus.readByte(cpuregs.PC-1);
      cpulog.dataCode = zeroFill(peekedzpy.toString(16).toUpperCase(), 2);
      cpulog.dataContent = "$" + zeroFill(peekedzpy.toString(16).toUpperCase(), 2) + ",Y @ "
                         + zeroFill((address).toString(16).toUpperCase(), 2) + " = "
                         + zeroFill((cpubus.readByte(address)).toString(16).toUpperCase(), 2);
      break;
    case ADDR_MODE.IZX:
      const peeked = cpubus.readByte(cpuregs.PC-1);
      const peekedStr = zeroFill((peeked).toString(16).toUpperCase(), 2);
      cpulog.dataCode = peekedStr;
      cpulog.dataContent = "($" + peekedStr + ",X) @ "
                         + zeroFill(((peeked + cpuregs.X) & 0xFF).toString(16).toUpperCase(), 2) + " = "
                         + zeroFill((address).toString(16).toUpperCase(), 4) + " = "
                         + zeroFill((cpubus.readByte(address)).toString(16).toUpperCase(), 2);
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
                         + zeroFill((cpubus.readByte(address)).toString(16).toUpperCase(), 2);
      break;
    case ADDR_MODE.IND:
      const peekedindStr = zeroFill((address).toString(16).toUpperCase(), 4);
      cpulog.dataCode = zeroFill((address&0xFF).toString(16).toUpperCase(), 2) + " "
                      + zeroFill(((address>>8)&0xFF).toString(16).toUpperCase(), 2);
      cpulog.dataContent = "($" + peekedindStr + ") = "
                         + zeroFill(cpuregs.PC.toString(16).toUpperCase(), 4);
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

export function debugCatchToLogFlie(path: string){
  let logContent = logTemplate(cpulog);
  fs.appendFileSync(path, logContent);
  debugRestCUPLog();
}