import * as fs from 'fs';
import { IBus } from './Bus';
import { IRegs } from './CPU';
export interface LOGS {
  PC: string;
  opCode: string;
  dataCode: string;
  opName: string;
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
  IMM,
  ABS,
  ZP,
  IZX,
  REL,
};

// Debug log
export var logTemplate = (
  logs:LOGS
) =>
`${logs.PC}  ${logs.opCode} ${logs.dataCode}` + " ".padStart(7-logs.dataCode.length) +
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
  dataCode: '',
  opName: '',
  dataContent: '',
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
    dataCode: '',
    opName: '',
    dataContent: '',
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
  cpulog.PC  = cpuregs.PC.toString(16).toUpperCase();
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

export function debugCatchDataCode(dataCode: any, addrMode: ADDR_MODE)
{
  if (dataCode > 0xFF){
    cpulog.dataCode = zeroFill((dataCode&0xFF).toString(16).toUpperCase(), 2) + " "
                    + zeroFill(((dataCode>>8)&0xFF).toString(16).toUpperCase(), 2);
  }
  else if (dataCode >= 0x00){
    cpulog.dataCode = zeroFill(dataCode.toString(16).toUpperCase(), 2);
  }
  else{
    cpulog.dataCode = "";
  }

  switch (addrMode){
    case ADDR_MODE.IMM:
      cpulog.dataContent = "#$" + zeroFill((dataCode&0xFF).toString(16).toUpperCase(), 2);
      break;
    case ADDR_MODE.ABS:
      cpulog.dataContent = "$" + zeroFill(((dataCode>>8)&0xFF).toString(16).toUpperCase(), 2)
                               + zeroFill((dataCode&0xFF).toString(16).toUpperCase(), 2);
      break;
    case ADDR_MODE.REL:
      dataCode += cpuregs.PC;
      cpulog.dataContent = "$" + zeroFill(((dataCode>>8)&0xFF).toString(16).toUpperCase(), 2)
                               + zeroFill((dataCode&0xFF).toString(16).toUpperCase(), 2);
      break;
    case ADDR_MODE.ZP:
      cpulog.dataContent = "$" + zeroFill((dataCode&0xFF).toString(16).toUpperCase(), 2) + " = "
                         + zeroFill((cpubus.readByte(dataCode)).toString(16).toUpperCase(), 2);
      break;
    default:
      break;
  }
}

export function debugCatchOpName(opName: any)
{
  cpulog.opName = opName;
}

export function writeToLogFlie(path: string){
  let logContent = logTemplate(cpulog);
  fs.appendFileSync(path, logContent);
  debugRestCUPLog();
}