import { ADDR_MODE, debugCatchClocks, debugCatchCPUBus, debugCatchCPURegs, debugCatchDataCode, debugCatchOpCode, debugCatchOpName, debugCatchRegs, logTemplate, writeToLogFlie } from '../Interface/Debug';
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
      case 0xA1:
        // LDA izx 6
        address = this.izx();
        this.LDA(address);
        this.addCycles(6);
        break;
      default:
        throw new Error(`Invalid opcode: ${opcode.toString(16).toUpperCase()}`);
    }
    // Debug log
    writeToLogFlie(this.userData);
  }

  private addCycles(cycle: number){
    this.deferCycles += cycle;
  }

  /************************************************/
  /* Addressing Mode
  /************************************************/
  private abs(): uint16{
    // Absolute
    const address =  this.bus.readWord(this.regs.PC);
    this.regs.PC += 2;
    debugCatchDataCode(address, ADDR_MODE.ABS);
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
    const peeked = this.bus.readWord(this.regs.PC);
    const address = this.bus.readWord(this.regs.X + peeked);
    if ((peeked & 0xFF00) !== (address & 0xFF00))
    {
      this.addCycles(1);
    }
    this.regs.PC += 2;
    debugCatchDataCode(address, ADDR_MODE.IZX);
    return address;
  }
  private zp(): uint16{
    // Zero Page
    const address = this.bus.readByte(this.regs.PC) & 0xFF;
    this.regs.PC += 1;
    debugCatchDataCode(address, ADDR_MODE.ZP);
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
    this.checkZNForReg(this.regs.X);
  }
  private LDA(address: uint16){
    debugCatchOpName("LDA");
    this.regs.A = this.bus.readByte(address);
    this.checkZNForReg(this.regs.A);
  }
  private LDY(address: uint16){
    debugCatchOpName("LDY");
    this.regs.Y = this.bus.readByte(address);
    this.checkZNForReg(this.regs.Y);
  }
  private STX(address: uint16){
    debugCatchOpName("STX");
    this.bus.writeByte(address, this.regs.X);
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
  private NOP(){
    debugCatchOpName("NOP");
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
    this.checkZNForReg(this.regs.A);
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
  private AND(address: uint16){
    debugCatchOpName("AND");
    this.regs.A = this.regs.A & this.bus.readByte(address);
    this.checkZNForReg(this.regs.A);
  }
  private ADC(address: uint16){
    debugCatchOpName("ADC");
    var flagC = this.isFlagSet(Flags.C) ? 1 : 0;
    var memory = this.bus.readByte(address);
    var result = this.regs.A + memory + flagC;
    this.setFlag(Flags.C, (result > 0xFF));
    this.setFlag(Flags.V, (((result ^ this.regs.A) & (result ^ memory) & 0x80) === 0x80));
    this.regs.A = result & 0xFF;
    this.checkZNForReg(this.regs.A);
  }
  private SBC(address: uint16){
    debugCatchOpName("SBC");
    var flagC = this.isFlagSet(Flags.C) ? 1 : 0;
    var memory = this.bus.readByte(address);
    var result = this.regs.A + (~memory) + flagC;
    this.setFlag(Flags.C, !(result < 0x00));
    this.setFlag(Flags.V, (((result ^ this.regs.A) & (result ^ (~memory)) & 0x80) === 0x80));
    this.regs.A = result & 0xFF;
    this.checkZNForReg(this.regs.A);
  }
  private ORA(address: uint16){
    debugCatchOpName("ORA");
    this.regs.A |= this.bus.readByte(address);
    this.checkZNForReg(this.regs.A);
  }
  private EOR(address: uint16){
    debugCatchOpName("EOR");
    this.regs.A ^= this.bus.readByte(address);
    this.checkZNForReg(this.regs.A);
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
    this.regs.Y++;
    this.checkZNForReg(this.regs.Y);
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
  /* Internal Helper.
  /************************************************/
  private checkZNForReg(reg: uint8){
    this.setFlag(Flags.Z, (reg === 0x00));
    this.setFlag(Flags.N, (reg & Flags.N) === Flags.N);
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