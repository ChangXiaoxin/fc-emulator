import * as fs from 'fs';
import { Regs } from "../FC/CPU2A03";
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

// Debug log
export var logTemplate = (
  logs:LOGS
) =>
`${logs.PC}  ${logs.opCode} ${logs.dataCode}` + " ".padStart(7-logs.dataCode.length) + 
`${logs.opName} ${logs.dataContent}` + " ".padStart(28-logs.dataContent.length) + 
`A:${logs.A} X:${logs.X} Y:${logs.Y} P:${logs.P} SP:${logs.SP} PPU:${logs.PPU} CYC:${logs.CYC}
`;

export function zeroFill(str: string, num: number): string{
  return str.padStart(num-str.length+1, "0");  
}
var cpuLog:LOGS = {
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
export function catchRegs(cpuRegs: Regs)
{
  cpuLog.PC  = cpuRegs.PC.toString(16).toUpperCase();
  cpuLog.A   = zeroFill(cpuRegs.A.toString(16).toUpperCase(), 2);
  cpuLog.X   = zeroFill(cpuRegs.X.toString(16).toUpperCase(), 2);
  cpuLog.Y   = zeroFill(cpuRegs.Y.toString(16).toUpperCase(), 2);
  cpuLog.P   = zeroFill(cpuRegs.P.toString(16).toUpperCase(), 2);
  cpuLog.SP  = zeroFill(cpuRegs.S.toString(16).toUpperCase(), 2);
}

export function catchClocks(cpuClocks: any)
{
  cpuLog.CYC = cpuClocks.toString();
}

export function catchOpCode(opCode: any)
{
  cpuLog.opCode = zeroFill(opCode.toString(16).toUpperCase(), 2);
}

export function writeToLogFlie(path: string){
  let logContent = logTemplate(cpuLog);
  fs.appendFileSync(path, logContent);
}