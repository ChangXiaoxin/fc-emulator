
import { uint16, uint8 } from "../Interface/typedef";
import { IBus } from "../Interface/Bus";
import { Cartridge } from "./cartridge";
import { CTRLFlags, PPU2C02, STATUSFlags } from "./PPU2C02";
import { Controller } from "./controller";
export class CPUBus implements IBus {
  public DMAAddr: uint8 = 0x00;
  public DMAPage: uint8 = 0x00;
  public DMAData: uint8 = 0x00;
  public DMAPupupu: boolean = false;
  public DMAEmpty: boolean = true;
  public cartridge!: Cartridge;
  public ppu!: PPU2C02;
  public controller!: Controller;
  public controllerState = new Uint8Array(2).fill(0);
  private readonly ram = new Uint8Array(2 * 1024).fill(0);
  
  public writeByte(address: uint16, data: uint8): void {
    data = data & 0xFF;
    if (address < 0x2000){
      // RAM
      this.ram[address & 0x07FF] = data;
    }
    else if (address < 0x4000){
      // PPU regs
      address = address & 0x0007;
      switch (address){
        case 0x0000:
          this.ppu.regs.CTRL = data;
          this.ppu.tramAddr.nametableX = this.ppu.getCtrlFlag(CTRLFlags.n) ? 0x01 : 0x00;
          this.ppu.tramAddr.nametableY = this.ppu.getCtrlFlag(CTRLFlags.N) ? 0x01 : 0x00;
          break;
        case 0x0001:
          this.ppu.regs.MASK = data;
          break;
        case 0x0002:
          // Can't write PPU status.
          break;
        case 0x0003:
          this.ppu.regs.OAMADDR = data;
          break;
        case 0x0004:
          this.ppu.regs.OAMDATA[this.ppu.regs.OAMADDR] = data;
          break;
        case 0x0005:
          if (this.ppu.addressLatch === 0x00){
            this.ppu.fineX = data & 0x07;
            this.ppu.tramAddr.coarseX = data >> 3;
            this.ppu.addressLatch = 0x01;
          }
          else{
            this.ppu.tramAddr.fineY = data & 0x07;
            this.ppu.tramAddr.coarseY = data >> 3;
            this.ppu.addressLatch = 0x00;
          }
          break;
        case 0x0006:
          if (this.ppu.addressLatch === 0x00){
            this.ppu.tramAddr.setloopy(((this.ppu.tramAddr.getloopy() & 0x00FF) | (data << 8)) & 0x7FFF);
            this.ppu.addressLatch = 0x01;
          }
          else{
            this.ppu.tramAddr.setloopy((this.ppu.tramAddr.getloopy() & 0xFF00) | data);
            this.ppu.vramAddr.setloopy(this.ppu.tramAddr.getloopy());
            this.ppu.addressLatch = 0x00;
          }
          break;
        case 0x0007:
          this.ppu.bus.writeByte(this.ppu.vramAddr.getloopy(), data);
          this.ppu.vramAddr.setloopy(this.ppu.vramAddr.getloopy() + (this.ppu.getCtrlFlag(CTRLFlags.I) ? 0x20 : 0x01));
          break;
        default:
          break;;
      }
    }
    else if (address < 0x6000){
      // PPU OAMDMA
      if (address === 0x4014){
        this.ppu.regs.OAMDMA = data;
        this.DMAPage = data;
        this.DMAAddr = 0x00;
        this.DMAPupupu = true;
      }
      // IO Registers
      if ((address >= 0x4016) && (address <= 0x4017)){
        address &= 0x0001;
        this.controllerState[address] = this.controller.ctrlState[address];
      }
    }
    else{
      // Cartridge
      this.cartridge.mapper.write(address, data);
    }
  }
  public readByte(address: uint16): uint8 {
    let memory = 0x00;
    if (address < 0x2000){
      // RAM
      memory = this.ram[address & 0x07FF];
    }
    else if (address < 0x4000){
      // PPU regs
      address = address & 0x0007;
      switch (address){
        case 0x0000:
          memory = this.ppu.regs.CTRL;
          break;
        case 0x0001:
          memory = this.ppu.regs.MASK;
          break;
        case 0x0002:
          memory = (this.ppu.regs.STATUS & 0xE0) | (this.ppu.dataBuffer & 0x1F);
          this.ppu.setStatusFlag(STATUSFlags.V, false);
          this.ppu.addressLatch = 0x00;
          break;
        case 0x0003:
          break;
        case 0x0004:
          memory = this.ppu.regs.OAMDATA[this.ppu.regs.OAMADDR];
          break;
        case 0x0005:
          break;
        case 0x0006:
          break;
        case 0x0007:
          memory = this.ppu.dataBuffer;
          this.ppu.dataBuffer = this.ppu.bus.readByte(this.ppu.vramAddr.getloopy());
          if (this.ppu.vramAddr.getloopy() > 0x3F00){
            memory = this.ppu.dataBuffer;
          }
          this.ppu.vramAddr.setloopy(this.ppu.vramAddr.getloopy() + (this.ppu.getCtrlFlag(CTRLFlags.I) ? 0x20 : 0x01));
          break;
        default:
          break;
      }
    }
    else if (address < 0x6000){
      // PPU OAMDMA
      if (address === 0x4014){
        memory = this.ppu.regs.OAMDMA;
      }
      // IO Registers
      if ((address >= 0x4016) && (address <= 0x4017)){
        address &= 0x0001;
        memory = (this.controllerState[address] & 0x80) > 0 ? 0x01 : 0x00;
        this.controllerState[address] = (this.controllerState[address] << 1) & 0xFF;
      }
    }
    else{
      // Cartridge
      memory = this.cartridge.mapper.read(address);
    }
    return memory & 0xFF;
  }
  public writeWord(address: uint16, data: uint16): void {
    this.writeByte(address, data & 0xFF);
    this.writeByte(address + 1, (data >> 8) & 0xFF);
  }
  public readWord(address: uint16): uint16 {
    return (this.readByte(address + 1) << 8) | (this.readByte(address)) & 0xFFFF;
  }
}