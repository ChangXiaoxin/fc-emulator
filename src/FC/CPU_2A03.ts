import { measureMemory } from "vm";
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

export class CPU_Regs implements IRegs{
  A = 0;
  X = 0;
  Y = 0;
  PC = 0;
  S = 0;
  P = 0;
}

export class CPU_2A03 implements ICPU {
  public bus!: IBus;

  private deferCycles = 0;
  private clocks = 0;
  private readonly regs = new CPU_Regs();
  constructor(){
    this.regs.A = 0;
    this.regs.X = 0;
    this.regs.Y = 0;
    // this.regs.PC = this.bus.readWord(InterruptVector.RESET);
    this.regs.PC = 0xC000;
    this.regs.S = 0xFD;
    this.regs.P = 0x04; // I === 1
    this.deferCycles = 0;
    this.clocks = 0;
  }
  public reset(): void {
    this.regs.A = 0; //unchanged
    this.regs.X = 0; //unchanged
    this.regs.Y = 0; //unchanged
    // this.regs.PC = this.bus.readWord(InterruptVector.RESET);
    this.regs.PC = 0xC000;
    this.regs.S -= 3;
    this.regs.P |= 0x04; // I === 1
    
    this.deferCycles = 0;
    this.clocks = 0;
  }

  public clock(): void {
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
      this.bus.writeByte(MemAddress.STACK_BASE + this.regs.P, byte & 0xFF);
      this.regs.P--;
  }

  public popByte(): uint8{
    this.regs.P++;
    return this.bus.readByte(MemAddress.STACK_BASE + this.regs.P);
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

  public step(): void {
    const opcode = this.bus.readByte(this.regs.PC++);
    switch (opcode) {
      case 0x4C:
        // JMP
        const address = this.bus.readWord(this.regs.PC);
        this.regs.PC = address;
        this.deferCycles += 3;
        break;
      default:
        throw new Error(`Invalid opcode: ${opcode}!`);
    }
  }
}