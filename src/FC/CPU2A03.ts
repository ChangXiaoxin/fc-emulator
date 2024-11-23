import { IBus } from "../Interface/Bus";
import { Flags, ICPU, IRegs } from "../Interface/CPU";
import { uint16, uint8 } from "../Interface/typedef";
import { ADDR_MODE, debugCatchClocks, debugCatchCPURegs, debugCatchDataCode, debugCatchOpCode, debugCatchOpName, debugCatchRegs, debugCatchToLogFlie } from '../Interface/Debug';

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
    debugCatchCPURegs(this.regs);

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
    return this.bus.readByte(MemAddress.STACK_BASE | (this.regs.S & 0xFF));
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
    let address: uint16 = 0xF0000;
    // Debug log
    debugCatchRegs();
    debugCatchClocks(this.clocks);

    const opcode = this.bus.readByte(this.regs.PC++);
    debugCatchOpCode(opcode);
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
      case 0x20:
        // JSR abs 6
        address = this.abs();
        this.JSR(address);
        this.addCycles(6);
        break;
      case 0xEA:
        // NOP 2
        this.NOP();
        this.addCycles(2);
        break;
      case 0x38:
        // SEC 2
        this.SEC();
        this.addCycles(2);
        break;
      case 0x18:
        // CLC 2
        this.CLC();
        this.addCycles(2);
        break;
      case 0xB0:
        // BCS rel 2*
        address = this.rel();
        this.BCS(address);
        this.addCycles(2);
        break;
      case 0x90:
        // BCC rel 2*
        address = this.rel();
        this.BCC(address);
        this.addCycles(2);
        break;
      case 0xA9:
        // LDA imm 2
        address = this.imm();
        this.LDA(address);
        this.addCycles(2);
        break;
      case 0xF0:
        // BEQ rel 2*
        address = this.rel();
        this.BEQ(address);
        this.addCycles(2);
        break;
      case 0xD0:
        // BNE rel 2*
        address = this.rel();
        this.BNE(address);
        this.addCycles(2);
        break;
      case 0x85:
        // STA zp 3
        address = this.zp();
        this.STA(address);
        this.addCycles(3);
        break;
      case 0x24:
        // BIT zp 3
        address = this.zp();
        this.BIT(address);
        this.addCycles(3);
        break;
      case 0x70:
        // BVS rel 2*
        address = this.rel();
        this.BVS(address);
        this.addCycles(2);
        break;
      case 0x50:
        // BVC rel 2*
        address = this.rel();
        this.BVC(address);
        this.addCycles(2);
        break;
      case 0x10:
        // BPL rel 2*
        address = this.rel();
        this.BPL(address);
        this.addCycles(2);
        break;
      case 0x60:
        // RTS 6
        this.RTS();
        this.addCycles(6);
        break;
      case 0x78:
        // SEI 2
        this.SEI();
        this.addCycles(2);
        break;
      case 0xF8:
        // SED 2
        this.SED();
        this.addCycles(2);
        break;
      case 0x08:
        // PHP 3
        this.PHP();
        this.addCycles(3);
        break;
      case 0x68:
        // PLA 4
        this.PLA();
        this.addCycles(4);
        break;
      case 0x29:
        // AND imm 2
        address = this.imm();
        this.AND(address);
        this.addCycles(2);
        break;
      case 0xC9:
        // CMP imm 2
        address = this.imm();
        this.CMP(address);
        this.addCycles(2);
        break;
      case 0xD8:
        // CLD 2
        this.CLD();
        this.addCycles(2);
        break;
      case 0x48:
        // PHA 3
        this.PHA();
        this.addCycles(3);
        break;
      case 0x28:
        // PLP 4
        this.PLP();
        this.addCycles(4);
        break;
      case 0x30:
        // BMI rel 2*
        address = this.rel();
        this.BMI(address);
        this.addCycles(2);
        break;
      case 0x09:
        // ORA imm 2
        address = this.imm();
        this.ORA(address);
        this.addCycles(2);
        break;
      case 0xB8:
        // CLV 2
        this.CLV();
        this.addCycles(2);
        break;
      case 0x49:
        // EOR imm 2
        address = this.imm();
        this.EOR(address);
        this.addCycles(2);
        break;
      case 0x69:
        // ADC imm 2
        address = this.imm();
        this.ADC(address);
        this.addCycles(2);
        break;
      case 0xA0:
        // LDY imm 2
        address = this.imm();
        this.LDY(address);
        this.addCycles(2);
        break;
      case 0xC0:
        // CPY imm 2
        address = this.imm();
        this.CPY(address);
        this.addCycles(2);
        break;
      case 0xE0:
        // CPX imm 2
        address = this.imm();
        this.CPX(address);
        this.addCycles(2);
        break;
      case 0xE9:
        // SBC imm 2
        address = this.imm();
        this.SBC(address);
        this.addCycles(2);
        break;
      case 0xC8:
        // INY 2
        this.INY();
        this.addCycles(2);
        break;
      case 0xE8:
        // INX 2
        this.INX();
        this.addCycles(2);
        break;
      case 0x88:
        // DEY 2
        this.DEY();
        this.addCycles(2);
        break;
      case 0xCA:
        // DEX 2
        this.DEX();
        this.addCycles(2);
        break;
      case 0xA8:
        // TAY 2
        this.TAY();
        this.addCycles(2);
        break;
      case 0xAA:
        // TAX 2
        this.TAX();
        this.addCycles(2);
        break;
      case 0x98:
        // TYA 2
        this.TYA();
        this.addCycles(2);
        break;
      case 0x8A:
        // TXA 2
        this.TXA();
        this.addCycles(2);
        break;
      case 0xBA:
        // TSX 2
        this.TSX();
        this.addCycles(2);
        break;
      case 0x8E:
        // STX abs 4
        address = this.abs();
        this.STX(address);
        this.addCycles(4);
        break;
      case 0x9A:
        // TXS 2
        this.TXS();
        this.addCycles(2);
        break;
      case 0xA1:
        // LDA izx 6
        address = this.izx();
        this.LDA(address);
        this.addCycles(6);
        break;
      case 0xAE:
        // LDX abs 4
        address = this.abs();
        this.LDX(address);
        this.addCycles(4);
        break;
      case 0xAD:
        // LDA abs 4
        address = this.abs();
        this.LDA(address);
        this.addCycles(4);
        break;
      case 0x40:
        // RTI 6
        this.RTI();
        this.addCycles(6);
        break;
      case 0x4A:
        // LSR 2
        this.LSR();
        this.addCycles(2);
        break;
      case 0x0A:
        // ASL 2
        this.ASL();
        this.addCycles(2);
        break;
      case 0x6A:
        // ROR 2
        this.ROR();
        this.addCycles(2);
        break;
      case 0x2A:
        // ROL 2
        this.ROL();
        this.addCycles(2);
        break;
      case 0xA5:
        // LDA zp 3
        address = this.zp();
        this.LDA(address);
        this.addCycles(3);
        break;
      case 0x8D:
        // STA abs 4
        address = this.abs();
        this.STA(address);
        this.addCycles(4);
        break;
      case 0xC9:
        // CMP imm 2
        address = this.imm();
        this.CMP(address);
        this.addCycles(2);
        break;
      case 0x81:
        // STA izx 6
        address = this.izx();
        this.STA(address);
        this.addCycles(6);
        break;
      case 0x01:
        // ORA izx 6
        address = this.izx();
        this.ORA(address);
        this.addCycles(6);
        break;
      case 0x21:
        // AND izx 6
        address = this.izx();
        this.AND(address);
        this.addCycles(6);
        break;
      case 0x41:
        // EOR izx 6
        address = this.izx();
        this.EOR(address);
        this.addCycles(6);
        break;
      case 0x61:
        // ADC izx 6
        address = this.izx();
        this.ADC(address);
        this.addCycles(6);
        break;
      case 0xC1:
        // CMP ixz 6
        address = this.izx();
        this.CMP(address);
        this.addCycles(6);
        break;
      case 0xE1:
        // SBC izx 6
        address = this.izx();
        this.SBC(address);
        this.addCycles(6);
        break;
      case 0xA4:
        // LDY zp 3
        address = this.zp();
        this.LDY(address);
        this.addCycles(3);
        break;
      case 0x84:
        // STY zp 3
        address = this.zp();
        this.STY(address);
        this.addCycles(3);
        break;
      case 0xA6:
        // LDX zp 3
        address = this.zp();
        this.LDX(address);
        this.addCycles(3);
        break;
      case 0x05:
        // ORA zp 3
        address = this.zp();
        this.ORA(address);
        this.addCycles(3);
        break;
      case 0x25:
        // AND zp 3
        address = this.zp();
        this.AND(address);
        this.addCycles(3);
        break;
      case 0x45:
        // EOR zp 3
        address = this.zp();
        this.EOR(address);
        this.addCycles(3);
        break;
      case 0x65:
        // ADC zp 3
        address = this.zp();
        this.ADC(address);
        this.addCycles(3);
        break;
      case 0xC5:
        // CMP zp 3
        address = this.zp();
        this.CMP(address);
        this.addCycles(3);
        break;
      case 0xE5:
        // SBC zp 3
        address = this.zp();
        this.SBC(address);
        this.addCycles(3);
        break;
      case 0xE4:
        // CPX zp 3
        address = this.zp();
        this.CPX(address);
        this.addCycles(3);
        break;
      case 0xC4:
        // CPY zp 3
        address = this.zp();
        this.CPY(address);
        this.addCycles(3);
        break;
      case 0x46:
        // LSR zp 5
        address = this.zp();
        this.LSR(address);
        this.addCycles(5);
        break;
      case 0x06:
        // ASL zp 5
        address = this.zp();
        this.ASL(address);
        this.addCycles(5);
        break;
      case 0x66:
        // ROR zp 5
        address = this.zp();
        this.ROR(address);
        this.addCycles(5);
        break;
      case 0x26:
        // ROL zp 5
        address = this.zp();
        this.ROL(address);
        this.addCycles(5);
        break;
      case 0xE6:
        // INC zp 5
        address = this.zp();
        this.INC(address);
        this.addCycles(5);
        break;
      case 0xC6:
        // DEC zp 5
        address = this.zp();
        this.DEC(address);
        this.addCycles(5);
        break;
      case 0xAC:
        // LDY abs 4
        address = this.abs();
        this.LDY(address);
        this.addCycles(4);
        break;
      case 0x8C:
        // STY abs 4
        address = this.abs();
        this.STY(address);
        this.addCycles(4);
        break;
      case 0x2C:
        // BIT abs 4
        address = this.abs();
        this.BIT(address);
        this.addCycles(4);
        break;
      case 0x0D:
        // ORA abs 4
        address = this.abs();
        this.ORA(address);
        this.addCycles(4);
        break;
      case 0x2D:
        // AND abs 4
        address = this.abs();
        this.AND(address);
        this.addCycles(4);
        break;
      case 0x4D:
        // EOR abs 4
        address = this.abs();
        this.EOR(address);
        this.addCycles(4);
        break;
      case 0x6D:
        // ADC abs 4
        address = this.abs();
        this.ADC(address);
        this.addCycles(4);
        break;
      case 0xCD:
        // CMP abs 4
        address = this.abs();
        this.CMP(address);
        this.addCycles(4);
        break;
      case 0xED:
        // SBC abs 4
        address = this.abs();
        this.SBC(address);
        this.addCycles(4);
        break;
      case 0xEC:
        // CPX abs 4
        address = this.abs();
        this.CPX(address);
        this.addCycles(4);
        break;
      case 0xCC:
        // CPY abs 4
        address = this.abs();
        this.CPY(address);
        this.addCycles(4);
        break;
      case 0x4E:
        // LSR abs 6
        address = this.abs();
        this.LSR(address);
        this.addCycles(6);
        break;
      case 0x0E:
        // ASL abs 6
        address = this.abs();
        this.ASL(address);
        this.addCycles(6);
        break;
      case 0x6E:
        // ROR abs 6
        address = this.abs();
        this.ROR(address);
        this.addCycles(6);
        break;
      case 0x2E:
        // ROL abs 6
        address = this.abs();
        this.ROL(address);
        this.addCycles(6);
        break;
      case 0xEE:
        // INC abs 6
        address = this.abs();
        this.INC(address);
        this.addCycles(6);
        break;
      case 0xCE:
        // DEC abs 6
        address = this.abs();
        this.DEC(address);
        this.addCycles(6);
        break;
      case 0xB1:
        // LDA izy 5*
        address = this.izy();
        this.LDA(address);
        this.addCycles(5);
        break;
      case 0x11:
        // ORA izy 5*
        address = this.izy();
        this.ORA(address);
        this.addCycles(5);
        break;
      case 0x31:
        // AND izy 5*
        address = this.izy();
        this.AND(address);
        this.addCycles(5);
        break;
      case 0x51:
        // EOR izy 5*
        address = this.izy();
        this.EOR(address);
        this.addCycles(5);
        break;
      case 0x71:
        // ADC izy 5*
        address = this.izy();
        this.ADC(address);
        this.addCycles(5);
        break;
      case 0xD1:
        // CMP izy 5*
        address = this.izy();
        this.CMP(address);
        this.addCycles(5);
        break;
      case 0xF1:
        // SBC izy 5*
        address = this.izy();
        this.SBC(address);
        this.addCycles(5);
        break;
      case 0x91:
        // STA izy 6
        address = this.izy(true);
        this.STA(address);
        this.addCycles(5);
        break;
      case 0x6C:
        // JMP ind 5
        address = this.ind();
        this.JMP(address);
        this.addCycles(5);
        break;
      case 0xB9:
        // LDA aby 4*
        address = this.aby();
        this.LDA(address);
        this.addCycles(4);
        break;
      case 0x19:
        // ORA aby 4*
        address = this.aby();
        this.ORA(address);
        this.addCycles(4);
        break;
      case 0x39:
        // AND aby 4*
        address = this.aby();
        this.AND(address);
        this.addCycles(4);
        break;
      case 0x59:
        // EOR aby 4*
        address = this.aby();
        this.EOR(address);
        this.addCycles(4);
        break;
      case 0x79:
        // ADC aby 4*
        address = this.aby();
        this.ADC(address);
        this.addCycles(4);
        break;
      case 0x99:
        // STA aby 5
        address = this.aby();
        this.STA(address);
        this.addCycles(5);
        break;
      case 0xD9:
        // CMP aby 4*
        address = this.aby();
        this.CMP(address);
        this.addCycles(4);
        break;
      case 0xF9:
        // SBC aby 4*
        address = this.aby();
        this.SBC(address);
        this.addCycles(4);
        break;
      case 0xB4:
        // LDY zpx 4
        address = this.zpx();
        this.LDY(address);
        this.addCycles(4);
        break;
      case 0x94:
        // STY zpx 4
        address = this.zpx();
        this.STY(address);
        this.addCycles(4);
        break;
      case 0x15:
        // ORA zpx 4
        address = this.zpx();
        this.ORA(address);
        this.addCycles(4);
        break;
      case 0x35:
        // AND zpx 4
        address = this.zpx();
        this.AND(address);
        this.addCycles(4);
        break;
      case 0x55:
        // EOR zpx 4
        address = this.zpx();
        this.EOR(address);
        this.addCycles(4);
        break;
      case 0x75:
        // ADC zpx 4
        address = this.zpx();
        this.ADC(address);
        this.addCycles(4);
        break;
      case 0x95:
        // STA zpx 4
        address = this.zpx();
        this.STA(address);
        this.addCycles(4);
        break;
      case 0xB5:
        // LDA zpx 4
        address = this.zpx();
        this.LDA(address);
        this.addCycles(4);
        break;
      case 0xD5:
        // CMP zpx 4
        address = this.zpx();
        this.CMP(address);
        this.addCycles(4);
        break;
      case 0xF5:
        // SBC zpx 4
        address = this.zpx();
        this.SBC(address);
        this.addCycles(4);
        break;
      case 0x56:
        // LSR zpx 6
        address = this.zpx();
        this.LSR(address);
        this.addCycles(6);
        break;
      case 0x16:
        // ASL zpx 6
        address = this.zpx();
        this.ASL(address);
        this.addCycles(6);
        break;
      case 0x36:
        // ROL zpx 6
        address = this.zpx();
        this.ROL(address);
        this.addCycles(6);
        break;
      case 0x76:
        // ROR zpx 6
        address = this.zpx();
        this.ROR(address);
        this.addCycles(6);
        break;
      case 0xD6:
        // DEC zpx 6
        address = this.zpx();
        this.DEC(address);
        this.addCycles(6);
        break;
      case 0xF6:
        // INC zpx 6
        address = this.zpx();
        this.INC(address);
        this.addCycles(6);
        break;
      case 0xB6:
        // LDX zpy 4
        address = this.zpy();
        this.LDX(address);
        this.addCycles(4);
        break;
      case 0x96:
        // STX zpy 4
        address = this.zpy();
        this.STX(address);
        this.addCycles(4);
        break;
      case 0xBC:
        // LDY abx 4*
        address = this.abx();
        this.LDY(address);
        this.addCycles(4);
        break;
      case 0x1D:
        // ORA abx 4*
        address = this.abx();
        this.ORA(address);
        this.addCycles(4);
        break;
      case 0x3D:
        // AND abx 4*
        address = this.abx();
        this.AND(address);
        this.addCycles(4);
        break;
      case 0x5D:
        // EOR abx 4*
        address = this.abx();
        this.EOR(address);
        this.addCycles(4);
        break;
      case 0x7D:
        // ADC abx 4*
        address = this.abx();
        this.ADC(address);
        this.addCycles(4);
        break;
      case 0xBD:
        // LDA abx 4*
        address = this.abx();
        this.LDA(address);
        this.addCycles(4);
        break;
      case 0xDD:
        // CMP abx 4*
        address = this.abx();
        this.CMP(address);
        this.addCycles(4);
        break;
      case 0xFD:
        // SBC abx 4*
        address = this.abx();
        this.SBC(address);
        this.addCycles(4);
        break;
      case 0x9D:
        // STA abx 5
        address = this.abx(true);
        this.STA(address);
        this.addCycles(4);
        break;
      case 0x5E:
        // LSR abx 7
        address = this.abx(true);
        this.LSR(address);
        this.addCycles(6);
        break;
      case 0x1E:
        // ASL abx 7
        address = this.abx(true);
        this.ASL(address);
        this.addCycles(6);
        break;
      case 0x3E:
        // ROL abx 7
        address = this.abx(true);
        this.ROL(address);
        this.addCycles(6);
        break;
      case 0x7E:
        // ROR abx 7
        address = this.abx(true);
        this.ROR(address);
        this.addCycles(6);
        break;
      case 0xDE:
        // DEC abx 7
        address = this.abx(true);
        this.DEC(address);
        this.addCycles(6);
        break;
      case 0xFE:
        // INC abx 7
        address = this.abx(true);
        this.INC(address);
        this.addCycles(6);
        break;
      case 0xBE:
        // LDX aby 4*
        address = this.aby();
        this.LDX(address);
        this.addCycles(4);
        break;
      // Unoffical opCode:
      case 0x04:
        // NOP zp 3
        address = this.zp();
        this.NOP(true);
        this.addCycles(3);
        break;
      case 0x44:
        // NOP zp 3
        address = this.zp();
        this.NOP(true);
        this.addCycles(3);
        break;
      case 0x64:
        // NOP zp 3
        address = this.zp();
        this.NOP(true);
        this.addCycles(3);
        break;
      case 0x0C:
        // NOP abs 4
        address = this.abs();
        this.NOP(true);
        this.addCycles(4);
        break;
      case 0x14:
        // NOP zpx 4
        address = this.zpx();
        this.NOP(true);
        this.addCycles(4);
        break;
      case 0x34:
        // NOP zpx 4
        address = this.zpx();
        this.NOP(true);
        this.addCycles(4);
        break;
      case 0x54:
        // NOP zpx 4
        address = this.zpx();
        this.NOP(true);
        this.addCycles(4);
        break;
      case 0x74:
        // NOP zpx 4
        address = this.zpx();
        this.NOP(true);
        this.addCycles(4);
        break;
      case 0xD4:
        // NOP zpx 4
        address = this.zpx();
        this.NOP(true);
        this.addCycles(4);
        break;
      case 0xF4:
        // NOP zpx 4
        address = this.zpx();
        this.NOP(true);
        this.addCycles(4);
        break;
      case 0x1A:
        // NOP 2
        this.NOP(true);
        this.addCycles(2);
        break;
      case 0x3A:
        // NOP 2
        this.NOP(true);
        this.addCycles(2);
        break;
      case 0x5A:
        // NOP 2
        this.NOP(true);
        this.addCycles(2);
        break;
      case 0x7A:
        // NOP 2
        this.NOP(true);
        this.addCycles(2);
        break;
      case 0xDA:
        // NOP 2
        this.NOP(true);
        this.addCycles(2);
        break;
      case 0xFA:
        // NOP 2
        this.NOP(true);
        this.addCycles(2);
        break;
      case 0x80:
        // NOP imm 2
        address = this.imm();
        this.NOP(true);
        this.addCycles(2);
        break;
      case 0x1C:
        // NOP abx 4*
        address = this.abx();
        this.NOP(true);
        this.addCycles(4);
        break;
      case 0x3C:
        // NOP abx 4*
        address = this.abx();
        this.NOP(true);
        this.addCycles(4);
        break;
      case 0x5C:
        // NOP abx 4*
        address = this.abx();
        this.NOP(true);
        this.addCycles(4);
        break;
      case 0x7C:
        // NOP abx 4*
        address = this.abx();
        this.NOP(true);
        this.addCycles(4);
        break;
      case 0xDC:
        // NOP abx 4*
        address = this.abx();
        this.NOP(true);
        this.addCycles(4);
        break;
      case 0xFC:
        // NOP abx 4*
        address = this.abx();
        this.NOP(true);
        this.addCycles(4);
        break;
      case 0xA3:
        // LAX izx 6
        address = this.izx();
        this.LAX(address);
        this.addCycles(6);
        break;
      default:
        throw new Error(`Invalid opcode: ${opcode.toString(16).toUpperCase()}`);
    }
    // Debug log
    debugCatchToLogFlie(this.userData);
  }

  private addCycles(cycle: number){
    this.deferCycles += cycle;
  }

  /************************************************/
  /* Addressing Mode
  /************************************************/
  private abs(): uint16{
    // Absolute
    const address = this.bus.readWord(this.regs.PC);
    this.regs.PC += 2;
    debugCatchDataCode(address, ADDR_MODE.ABS);
    return address;
  }
  private aby(oops:boolean = false): uint16{
    // Absolute indexed
    const memory = this.bus.readWord(this.regs.PC);
    const address = 0xFFFF & (memory + this.regs.Y);
    // oops cycle for different page
    if ((memory & 0xFF00) !== (address & 0xFF00) || oops)
    {
      this.addCycles(1);
    }
    this.regs.PC += 2;
    debugCatchDataCode(address, ADDR_MODE.ABY);
    return address;
  }
  private abx(oops:boolean = false): uint16{
    // Absolute indexed
    const memory = this.bus.readWord(this.regs.PC);
    const address = 0xFFFF & (memory + this.regs.X);
    // oops cycle for different page
    if ((memory & 0xFF00) !== (address & 0xFF00) || oops)
    {
      this.addCycles(1);
    }
    this.regs.PC += 2;
    debugCatchDataCode(address, ADDR_MODE.ABX);
    return address;
  }
  private imm(): uint16{
    // Immediate
    const address = this.regs.PC;
    this.regs.PC += 1;
    debugCatchDataCode(this.bus.readByte(address), ADDR_MODE.IMM);
    return address;
  }
  private izx(): uint16{
    // Indexed Indirect X
    const peeked1 = this.bus.readByte(this.regs.PC);
    const peeked2 = this.bus.readByte((this.regs.X + peeked1) & 0xFF);
    const peeked3 = this.bus.readByte((this.regs.X + peeked1 + 1) & 0xFF) << 8;
    const address = peeked3 | peeked2;
    this.regs.PC += 1;
    debugCatchDataCode(address, ADDR_MODE.IZX);
    return address;
  }
  private izy(oops:boolean = false): uint16{
    // Indirect indexed Y
    const peeked1 = this.bus.readByte(this.regs.PC);
    const peeked2 = this.bus.readByte(peeked1);
    const peeked3 = this.bus.readByte((peeked1 + 1) & 0xFF) << 8;
    const address = 0xFFFF & ((peeked3 | peeked2) + this.regs.Y);
    // oops cycle for different page
    if (((peeked3 | peeked2) & 0xFF00) !== (address & 0xFF00) || oops)
    {
      this.addCycles(1);
    }
    this.regs.PC += 1;
    debugCatchDataCode(address, ADDR_MODE.IZY);
    return address;
  }
  private ind(): uint16{
    // Indirect (Special for JMP)
    let memory = this.bus.readWord(this.regs.PC);
    let address = 0x00;
    this.regs.PC += 2;
    // implement the JMP ind BUG: cannot peek cross the page normally.
    // The indirect addressing mode uses the operand as a pointer, 
    // getting the new 2-byte program counter value from the specified address.
    // Unfortunately, because of a CPU bug, if this 2-byte variable has an 
    // address ending in $FF and thus crosses a page, then the CPU fails to 
    // increment the page when reading the second byte and thus reads the wrong
    // address. For example, JMP ($03FF) reads $03FF and $0300 instead of $0400.
    // Care should be taken to ensure this variable does not cross a page.
    if ((memory & 0x00FF) === 0x00FF){
      const address2 = memory & 0xFF00;
      address = (this.bus.readByte(address2) << 8) | (this.bus.readByte(memory)) & 0xFFFF;
    }
    else{
      address = this.bus.readWord(memory);
    }
    debugCatchDataCode(memory, ADDR_MODE.IND);
    return address;
  }
  private zp(): uint16{
    // Zero Page
    const address = this.bus.readByte(this.regs.PC) & 0xFF;
    this.regs.PC += 1;
    debugCatchDataCode(address, ADDR_MODE.ZP);
    return address;
  }
  private zpx(): uint16{
    // Zero page indexed
    const address = (this.bus.readByte(this.regs.PC) + this.regs.X) & 0xFF;
    this.regs.PC += 1;
    debugCatchDataCode(address, ADDR_MODE.ZPX);
    return address;
  }
  private zpy(): uint16{
    // Zero page indexed
    const address = (this.bus.readByte(this.regs.PC) + this.regs.Y) & 0xFF;
    this.regs.PC += 1;
    debugCatchDataCode(address, ADDR_MODE.ZPY);
    return address;
  }
  private rel(): uint8{
    // Relative
    const address = this.bus.readByte(this.regs.PC) & 0xFF;
    this.regs.PC += 1;
    debugCatchDataCode(address, ADDR_MODE.REL);
    return address;
  }

  /************************************************/
  /* Operations
  /************************************************/
  private JMP(address: uint16){
    debugCatchOpName("JMP");
    this.regs.PC = address;
  }
  private LDX(address: uint16){
    debugCatchOpName("LDX");
    this.regs.X = this.bus.readByte(address);
    this.checkResultZN(this.regs.X);
  }
  private LDA(address: uint16){
    debugCatchOpName("LDA");
    this.regs.A = this.bus.readByte(address);
    this.checkResultZN(this.regs.A);
  }
  private LDY(address: uint16){
    debugCatchOpName("LDY");
    this.regs.Y = this.bus.readByte(address);
    this.checkResultZN(this.regs.Y);
  }
  private STX(address: uint16){
    debugCatchOpName("STX");
    this.bus.writeByte(address, this.regs.X);
  }
  private STY(address: uint16){
    debugCatchOpName("STY");
    this.bus.writeByte(address, this.regs.Y);
  }
  private STA(address: uint16){
    debugCatchOpName("STA");
    this.bus.writeByte(address, this.regs.A);
  }
  private BIT(address: uint16){
    debugCatchOpName("BIT");
    var memory = this.bus.readByte(address);
    this.setFlag(Flags.Z, (this.regs.A & memory) === 0x00);
    this.setFlag(Flags.N, (memory & Flags.N) === Flags.N);
    this.setFlag(Flags.V, (memory & Flags.V) === Flags.V);
  }
  private JSR(address: uint16){
    debugCatchOpName("JSR");
    this.pushWord(this.regs.PC - 1);
    this.regs.PC = address;
  }
  private NOP(unoffical:boolean = false){
    // *NOP for unoffical opCode.
    debugCatchOpName(unoffical? "*NOP" : "NOP");
  }
  private CLC(){
    debugCatchOpName("CLC");
    this.setFlag(Flags.C, false);
  }
  private CLD(){
    debugCatchOpName("CLD");
    this.setFlag(Flags.D, false);
  }
  private CLV(){
    debugCatchOpName("CLV");
    this.setFlag(Flags.V, false);
  }
  private SEC(){
    debugCatchOpName("SEC");
    this.setFlag(Flags.C, true);
  }
  private SEI(){
    debugCatchOpName("SEI");
    /* FIXME: The effect of changing this flag I is delayed 1 instruction.
     * SEI sets the interrupt disable flag, preventing the CPU from handling hardware IRQs.
     * The effect of changing this flag is delayed one instruction because the flag is
     * changed after IRQ is polled, allowing an IRQ to be serviced between this and the
     * next instruction if the flag was previously 0. */
    this.setFlag(Flags.I, true);
  }
  private SED(){
    debugCatchOpName("SED");
    this.setFlag(Flags.D, true);
  }
  private PHP(){
    debugCatchOpName("PHP");
    this.pushByte(this.regs.P | Flags.B | Flags.U);
  }
  private PHA(){
    debugCatchOpName("PHA");
    this.pushByte(this.regs.A);
  }
  private PLA(){
    debugCatchOpName("PLA");
    this.regs.A = this.popByte();
    this.checkResultZN(this.regs.A);
  }
  private PLP(){
    debugCatchOpName("PLP");
    let popedP = this.popByte();
    this.setFlag(Flags.C, (popedP & Flags.C) === Flags.C);
    this.setFlag(Flags.Z, (popedP & Flags.Z) === Flags.Z);
    // FIXME: The effect of changing this flag I is delayed 1 instruction.
    this.setFlag(Flags.I, (popedP & Flags.I) === Flags.I);
    this.setFlag(Flags.D, (popedP & Flags.D) === Flags.D);
    this.setFlag(Flags.V, (popedP & Flags.V) === Flags.V);
    this.setFlag(Flags.N, (popedP & Flags.N) === Flags.N);
  }
  private RTI(){
    debugCatchOpName("RTI");
    this.regs.P = (this.regs.P & 0x30) | (this.popByte() & 0xCF);
    this.regs.PC = this.popWord();
  }
  private LSR(address: uint16 = 0xF0000){
    debugCatchOpName("LSR");
    if (address === 0xF0000){
      this.setFlag(Flags.C, ((this.regs.A & 0x01) === 0x01));
      this.regs.A = 0xFF & (this.regs.A >> 1);
      this.checkResultZN(this.regs.A);
    }
    else{
      let memory = this.bus.readByte(address);
      this.setFlag(Flags.C, ((memory & 0x01) === 0x01));
      memory = 0xFF & (memory >> 1);
      this.bus.writeByte(address, memory);
      this.checkResultZN(memory);
    }
  }
  private ASL(address: uint16 = 0xF0000){
    debugCatchOpName("ASL");
    if (address === 0xF0000){
      this.setFlag(Flags.C, ((this.regs.A & 0x80) === 0x80));
      this.regs.A = 0xFF & (this.regs.A << 1);
      this.checkResultZN(this.regs.A);
    }
    else{
      let memory = this.bus.readByte(address);
      this.setFlag(Flags.C, ((memory & 0x80) === 0x80));
      memory = 0xFF & (memory << 1);
      this.bus.writeByte(address, memory);
      this.checkResultZN(memory);
    }
  }
  private ROR(address: uint16 = 0xF0000){
    debugCatchOpName("ROR");
    if (address === 0xF0000){
      let flagC = this.isFlagSet(Flags.C);
      this.setFlag(Flags.C, ((this.regs.A & 0x01) === 0x01));
      this.regs.A = 0xFF & (this.regs.A >> 1);
      if (flagC){
        this.regs.A |= 0x80;
      }
      this.checkResultZN(this.regs.A);
    }
    else{
      let memory = this.bus.readByte(address);
      let flagC = this.isFlagSet(Flags.C);
      this.setFlag(Flags.C, ((memory & 0x01) === 0x01));
      memory = 0xFF & (memory >> 1);
      if (flagC){
        memory |= 0x80;
      }
      this.bus.writeByte(address, memory);
      this.checkResultZN(memory);
    }
  }
  private ROL(address: uint16 = 0xF0000){
    debugCatchOpName("ROL");
    if (address === 0xF0000){
      let flagC = this.isFlagSet(Flags.C);
      this.setFlag(Flags.C, ((this.regs.A & 0x80) === 0x80));
      this.regs.A = 0xFF & (this.regs.A << 1);
      if (flagC){
        this.regs.A |= 0x01;
      }
      this.checkResultZN(this.regs.A);
    }
    else{
      let memory = this.bus.readByte(address);
      let flagC = this.isFlagSet(Flags.C);
      this.setFlag(Flags.C, ((memory & 0x80) === 0x80));
      memory = 0xFF & (memory << 1);
      if (flagC){
        memory |= 0x01;
      }
      this.bus.writeByte(address, memory);
      this.checkResultZN(memory);
    }
  }
  private AND(address: uint16){
    debugCatchOpName("AND");
    this.regs.A = this.regs.A & this.bus.readByte(address);
    this.checkResultZN(this.regs.A);
  }
  private ADC(address: uint16){
    debugCatchOpName("ADC");
    var flagC = this.isFlagSet(Flags.C) ? 1 : 0;
    var memory = this.bus.readByte(address);
    var result = this.regs.A + memory + flagC;
    this.setFlag(Flags.C, (result > 0xFF));
    this.setFlag(Flags.V, (((result ^ this.regs.A) & (result ^ memory) & 0x80) === 0x80));
    this.regs.A = result & 0xFF;
    this.checkResultZN(this.regs.A);
  }
  private SBC(address: uint16){
    debugCatchOpName("SBC");
    var flagC = this.isFlagSet(Flags.C) ? 1 : 0;
    var memory = this.bus.readByte(address);
    var result = this.regs.A + (~memory) + flagC;
    this.setFlag(Flags.C, !(result < 0x00));
    this.setFlag(Flags.V, (((result ^ this.regs.A) & (result ^ (~memory)) & 0x80) === 0x80));
    this.regs.A = result & 0xFF;
    this.checkResultZN(this.regs.A);
  }
  private ORA(address: uint16){
    debugCatchOpName("ORA");
    this.regs.A |= this.bus.readByte(address);
    this.checkResultZN(this.regs.A);
  }
  private EOR(address: uint16){
    debugCatchOpName("EOR");
    this.regs.A ^= this.bus.readByte(address);
    this.checkResultZN(this.regs.A);
  }
  private CMP(address: uint16){
    debugCatchOpName("CMP");
    this.CMPHelper(this.regs.A, address);
  }
  private CPY(address: uint16){
    debugCatchOpName("CPY");
    this.CMPHelper(this.regs.Y, address);
  }
  private CPX(address: uint16){
    debugCatchOpName("CPX");
    this.CMPHelper(this.regs.X, address);
  }
  private INY(){
    debugCatchOpName("INY");
    this.regs.Y = 0xFF & (this.regs.Y + 1);
    this.checkResultZN(this.regs.Y);
  }
  private INX(){
    debugCatchOpName("INX");
    this.regs.X = 0xFF & (this.regs.X + 1);
    this.checkResultZN(this.regs.X);
  }
  private INC(address: uint16){
    debugCatchOpName("INC");
    let memory = this.bus.readByte(address);
    memory = 0xFF & (memory + 1);
    this.bus.writeByte(address, memory);
    this.checkResultZN(memory);
  }
  private DEY(){
    debugCatchOpName("DEY");
    this.regs.Y = 0xFF & (this.regs.Y - 1);
    this.checkResultZN(this.regs.Y);
  }
  private DEX(){
    debugCatchOpName("DEX");
    this.regs.X = 0xFF & (this.regs.X - 1);
    this.checkResultZN(this.regs.X);
  }
  private DEC(address: uint16){
    debugCatchOpName("DEC");
    let memory = this.bus.readByte(address);
    memory = memory - 1;
    this.bus.writeByte(address, memory & 0xFF);
    this.checkResultZN(memory);
  }
  private TAY(){
    debugCatchOpName("TAY");
    this.regs.Y = this.regs.A;
    this.checkResultZN(this.regs.Y);
  }
  private TAX(){
    debugCatchOpName("TAX");
    this.regs.X = this.regs.A;
    this.checkResultZN(this.regs.X);
  }
  private TXA(){
    debugCatchOpName("TXA");
    this.regs.A = this.regs.X;
    this.checkResultZN(this.regs.A);
  }
  private TYA(){
    debugCatchOpName("TYA");
    this.regs.A = this.regs.Y;
    this.checkResultZN(this.regs.A);
  }
  private TSX(){
    debugCatchOpName("TSX");
    this.regs.X = this.regs.S;
    this.checkResultZN(this.regs.X);
  }
  private TXS(){
    debugCatchOpName("TXS");
    this.regs.S = this.regs.X;
  }
  private BCS(address: uint16){
    debugCatchOpName("BCS");
    this.branchHelper(this.isFlagSet(Flags.C), address);
  }
  private BCC(address: uint16){
    debugCatchOpName("BCC");
    this.branchHelper(!this.isFlagSet(Flags.C), address);
  }
  private BEQ(address: uint16){
    debugCatchOpName("BEQ");
    this.branchHelper(this.isFlagSet(Flags.Z), address);
  }
  private BNE(address: uint16){
    debugCatchOpName("BNE");
    this.branchHelper(!this.isFlagSet(Flags.Z), address);
  }
  private BVS(address: uint16){
    debugCatchOpName("BVS");
    this.branchHelper(this.isFlagSet(Flags.V), address);
  }
  private BVC(address: uint16){
    debugCatchOpName("BVC");
    this.branchHelper(!this.isFlagSet(Flags.V), address);
  }
  private BPL(address: uint16){
    debugCatchOpName("BPL");
    this.branchHelper(!this.isFlagSet(Flags.N), address);
  }
  private BMI(address: uint16){
    debugCatchOpName("BMI");
    this.branchHelper(this.isFlagSet(Flags.N), address);
  }
  private RTS(){
    debugCatchOpName("RTS");
    this.regs.PC = this.popWord();
    this.regs.PC += 1;
  }

  /************************************************/
  /* Unoffical Operations.
  /************************************************/
  private LAX(addCycles: uint16){
    debugCatchOpName("*LAX");
    
  }

  /************************************************/
  /* Internal Helper.
  /************************************************/
  private checkResultZN(result: uint8){
    this.setFlag(Flags.Z, (result === 0x00));
    this.setFlag(Flags.N, (result & Flags.N) === Flags.N);
  }
  private CMPHelper(reg: uint8, address: uint16){
    let memory = this.bus.readByte(address);
    this.setFlag(Flags.C, (reg >= memory));
    this.setFlag(Flags.Z, (reg === memory));
    this.setFlag(Flags.N, ((reg - memory) & Flags.N) === Flags.N);
  }
  private branchHelper(flag: boolean, offset: uint8){
    if (flag){
      var prevPCHigh = this.regs.PC & 0xFF00;
      this.addCycles(1);
      if (offset & 0x80){
        offset = -this.complement(offset);
      }
      this.regs.PC += offset;
      var curPCHigh = this.regs.PC & 0xFF00;
      if (prevPCHigh !== curPCHigh){
        // Crossing page boundary, cost a cycle.
        this.addCycles(1);
      }
    }
  }
  private complement(value: uint8){
    return (~value & 0xFF) + 1;
  }

}