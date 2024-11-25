
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
    if (address < 0x2000){
      // RAM
      return this.ram[address & 0x07FF];
    }
    else if (address < 0x4000){
      // PPU regs
      address = address & 0x0007;
      return this.ppu.regs[address];
    }
    else if (address < 0x6000){
      // PPU OAMDMA
      if (address === 0x4014){
        return this.ppu.regs[PPUReg.OAMDMA];
      }
      // IO Registers
      return 0xFF;
    }
    else{
      // Cartridge
      return this.cartridge.mapper.read(address);
    }
  }
  public writeWord(address: uint16, data: uint16): void {
    this.writeByte(address, data & 0xFF);
    this.writeByte(address + 1, (data >> 8) & 0xFF);
  }
  public readWord(address: uint16): uint16 {
    return (this.readByte(address + 1) << 8) | (this.readByte(address)) & 0xFFFF;
  }
}