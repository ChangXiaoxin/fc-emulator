
import { uint16, uint8 } from "../Interface/typedef";
import { IBus } from "../Interface/Bus";
import { Cartridge } from "./cartridge";
import { PPU2C02, STATUSFlags } from "./PPU2C02";
export class CPUBus implements IBus {
  public cartridge!: Cartridge;
  public ppu!: PPU2C02;

  private readonly ram = new Uint8Array(2 * 1024).fill(0);
  
  public writeByte(address: uint16, data: uint8): void {
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
          this.ppu.regs.OAMDATA = data;
          break;
        case 0x0005:
          this.ppu.regs.SCROLL = data;
          break;
        case 0x0006:
          if (this.ppu.addressLatch === 0x00){
            this.ppu.regs.ADDR = (this.ppu.regs.ADDR & 0x00FF) | (data << 8);
            this.ppu.addressLatch = 0x01;
          }
          else{
            this.ppu.regs.ADDR = (this.ppu.regs.ADDR & 0xFF00) | data;
            this.ppu.addressLatch = 0x00;
          }
          break;
        case 0x0007:
          this.ppu.bus.writeByte(this.ppu.regs.ADDR, data);
          break;
        default:
          break;;
      }
    }
    else if (address < 0x6000){
      // PPU OAMDMA
      if (address === 0x4014){
        this.ppu.regs.OAMDMA = data;
      }
      // IO Registers
    }
    else{
      // Cartridge
      this.cartridge.mapper.write(address, data);
    }
  }
  public readByte(address: uint16): uint8 {
    let memory = 0xFF;
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
          this.ppu.setStatusFlag(STATUSFlags.V, true);  // hackin for debug
          memory = (this.ppu.regs.STATUS & 0xE0) | (this.ppu.dataBuffer & 0x1F);
          this.ppu.setStatusFlag(STATUSFlags.V, false);
          this.ppu.addressLatch = 0x00;
          break;
        case 0x0003:
          memory = this.ppu.regs.OAMADDR;
          break;
        case 0x0004:
          memory = this.ppu.regs.OAMDATA;
          break;
        case 0x0005:
          memory = this.ppu.regs.SCROLL;
          break;
        case 0x0006:
          break;
        case 0x0007:
          memory = this.ppu.dataBuffer;
          this.ppu.dataBuffer = this.ppu.bus.readByte(this.ppu.regs.ADDR);
          if (this.ppu.regs.ADDR > 0x3F00){
            memory = this.ppu.dataBuffer;
          }
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