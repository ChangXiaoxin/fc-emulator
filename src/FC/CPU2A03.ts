import * as fs from 'fs';
import { LOGS, logTemplate } from '../Interface/Debug';
import { IBus } from "../Interface/Bus";
import { Flags, ICPU, IRegs } from "../Interface/CPU";
import { uint16, uint8 } from "../Interface/typedef";

enum InterruptVector {
  NMI = 0xFFFA,
  RESET = 0xFFFC,
  IRQ = 0xFFFE,
}

enum MemAddress {
  STACK_BASE = 0x100,
}

export class Regs implements IRegs{
  A = 0;
  X = 0;
  Y = 0;
  PC = 0;
  S = 0;
  P = 0;
}

export class CPU2A03 implements ICPU {
  public bus!: IBus;

  private deferCycles = 0;
  private clocks = 0;
  private readonly regs = new Regs();
  // Debug log
  private userData?: any;
  constructor(userdata?: any){
    this.userData = userdata;

    this.regs.A = 0;
    this.regs.X = 0;
    this.regs.Y = 0;
    // this.regs.PC = this.bus.readWord(InterruptVector.RESET);
    this.regs.PC = 0xC000;
    this.regs.S = 0xFD;
    this.regs.P = 0x24; // I,U === 1
    this.deferCycles = 0;
    this.clocks = 6;
  }
  private zeroFill(str: string, num: number): string{
    return str.padStart(num-str.length+1, "0");
  
  }
  public reset(): void {
    this.regs.A = 0; //unchanged
    this.regs.X = 0; //unchanged
    this.regs.Y = 0; //unchanged
    // this.regs.PC = this.bus.readWord(InterruptVector.RESET);
    this.regs.PC = 0xC000;
    this.regs.S -= 3;
    this.regs.P |= 0x24; // I,U === 1
    
    this.deferCycles = 0;
    this.clocks = 0;
  }

  public clock(): void {
    this.clocks++;
    if (this.deferCycles === 0){
      this.step();
    }
    this.deferCycles--;
  }
  public isFlagSet(flag: Flags){
    return (this.regs.P & flag) === flag;
  }
  public setFlag(flag: Flags, set: boolean){
    if (set){
      this.regs.P |= flag;
    }
    else{
      this.regs.P &= ~flag;
    }
  }

  public pushByte(byte: uint8){
      this.bus.writeByte(MemAddress.STACK_BASE | this.regs.S, byte & 0xFF);
      this.regs.S--;
  }

  public popByte(): uint8{
    this.regs.S++;
    return this.bus.readByte(MemAddress.STACK_BASE | this.regs.S);
  }

  public pushWord(word: uint16){
    this.pushByte((word >> 8) & 0xFF);
    this.pushByte(word & 0xFF);
  }

  public popWord(): uint16{
    return this.popByte() | (this.popByte() << 8);
  }

  public irq(): void {
    if (this.isFlagSet(Flags.I)){
      return;
    }

    this.pushWord(this.regs.PC);
    this.pushByte((this.regs.P | Flags.U) & ~Flags.B);
    this.setFlag(Flags.I, true);
    this.regs.PC = this.bus.readWord(InterruptVector.IRQ);
    this.deferCycles += 7;
  }

  public nmi(): void {
    this.pushWord(this.regs.PC);
    this.pushByte((this.regs.P | Flags.U) & ~Flags.B);
    this.setFlag(Flags.I, true);
    this.regs.PC = this.bus.readWord(InterruptVector.NMI);
    this.deferCycles += 7;
  }

  private step(): void {
    // Debug log
    let cpuLog:LOGS = {
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
    cpuLog.PC  = this.regs.PC.toString(16).toUpperCase();
    cpuLog.A   = this.zeroFill(this.regs.A.toString(16).toUpperCase(), 2);
    cpuLog.X   = this.zeroFill(this.regs.X.toString(16).toUpperCase(), 2);
    cpuLog.Y   = this.zeroFill(this.regs.Y.toString(16).toUpperCase(), 2);
    cpuLog.P   = this.zeroFill(this.regs.P.toString(16).toUpperCase(), 2);
    cpuLog.SP  = this.zeroFill(this.regs.S.toString(16).toUpperCase(), 2);
    cpuLog.CYC = this.clocks.toString();

    const opcode = this.bus.readByte(this.regs.PC++);
    let address: uint16 = 0xF0000;
    switch (opcode) {
      case 0x4C:
        // JMP abs 3
        address = this.abs();
        this.JMP(address);
        this.addCycles(3);
        break;
      case 0xA2:
        // LDX imm 2
        address = this.imm();
        this.LDX(address);
        this.addCycles(2);
        break;
      case 0x86:
        // STX zp 3
        address = this.zp();
        this.STX(address);
        this.addCycles(3);
        break;
      case 0xA1:
        // LDA izx 6
        address = this.izx();
        // TODO: operation LDA
        this.addCycles(6);
        break;
      default:
        throw new Error(`Invalid opcode: ${opcode}!`);
    }
    // Debug log
    let logContent = logTemplate(cpuLog);
    fs.appendFileSync(this.userData, logContent);
  }

  private addCycles(cycle: number){
    this.deferCycles += cycle;
  }

  // Addressing Mode
  private abs(): uint16{
    // Absolute
    const address =  this.bus.readWord(this.regs.PC);
    this.regs.PC += 2;
    return address;
  }
  private imm(): uint16{
    // Immediate
    const address = this.regs.PC;
    this.regs.PC += 1;
    return address;
  }
  private izx(): uint16{
    // Indexed Indirect X
    const peeked = this.bus.readWord(this.regs.PC);
    const address = this.bus.readWord(this.regs.X + peeked);
    if ((peeked & 0xFF00) !== (address & 0xFF00))
    {
      this.addCycles(1);
    }
    this.regs.PC += 2;
    return address;
  }
  private zp(): uint16{
    // Zero Page
    const address = this.bus.readByte(this.regs.PC) & 0xFF;
    this.regs.PC += 1;
    return address;
  }

  // Operations
  private JMP(address: uint16){
    this.regs.PC = address;
  }
  private LDX(address: uint16){
    this.regs.X = this.bus.readByte(address);
    this.setFlag(Flags.N, (this.regs.X & 0x80) === 0x80);
    this.setFlag(Flags.Z, this.regs.X === 0x00);
  }
  private STX(address: uint16){
    this.bus.writeByte(address, this.regs.X);
  }

}