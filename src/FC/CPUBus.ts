
import { uint16, uint8 } from "../Interface/typedef";
import { IBus } from "../Interface/Bus";
import { Cartridge } from "./cartridge";
import { PPU2C02, PPUReg } from "./PPU2C02";

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
          this.ppu.regs[PPUReg.CTRL] = data;
          break;
        case 0x0001:
          this.ppu.regs[PPUReg.MASK] = data;
          break;
        case 0x0002:
          // Can't write PPU status.
          break;
        case 0x0003:
          this.ppu.regs[PPUReg.OAMADDR] = data;
          break;
        case 0x0004:
          this.ppu.regs[PPUReg.OAMDATA] = data;
          break;
        case 0x0005:
          this.ppu.regs[PPUReg.SCROLL] = data;
          break;
        case 0x0006:
          this.ppu.regs[PPUReg.ADDR] = data;
          break;
        case 0x0007:
          this.ppu.regs[PPUReg.DATA] = data;
          break;
        default:
          break;
      }
      this.ppu.regs[address] = data;
    }
    else if (address < 0x6000){
      // PPU OAMDMA
      if (address === 0x4014){
        this.ppu.regs[PPUReg.OAMDMA] = data;
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
          memory = this.ppu.regs[PPUReg.CTRL];
          break;
        case 0x0001:
          memory = this.ppu.regs[PPUReg.MASK];
          break;
        case 0x0002:
          memory = this.ppu.regs[PPUReg.STATUS];
          break;
        case 0x0003:
          memory = this.ppu.regs[PPUReg.OAMADDR];
          break;
        case 0x0004:
          memory = this.ppu.regs[PPUReg.OAMDATA];
          break;
        case 0x0005:
          memory = this.ppu.regs[PPUReg.SCROLL];
          break;
        case 0x0006:
          memory = this.ppu.regs[PPUReg.ADDR];
          break;
        case 0x0007:
          memory = this.ppu.regs[PPUReg.DATA];
          break;
        default:
          break;
      }
    }
    else if (address < 0x6000){
      // PPU OAMDMA
      if (address === 0x4014){
        memory = this.ppu.regs[PPUReg.OAMDMA];
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