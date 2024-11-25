import { IBus } from "../Interface/Bus";
import { uint16, uint8 } from "../Interface/typedef";
import { Cartridge, Mirror } from "./cartridge";

export class PPUBus implements IBus {
  public cartridge!: Cartridge;

  private readonly vram = new Uint8Array(2 * 1024).fill(0);
  private readonly Pram = new Uint8Array(32).fill(0);
  
  public writeByte(address: uint16, data: uint8): void {
    address &= 0x3FFF;
    if (address < 0x2000){
      // Cartridge Pattern Tables
      this.cartridge.mapper.write(address, data);
    }
    else if (address < 0x3000){
      // Name Tables VRAM
      if (this.cartridge.info.mirror === Mirror.HORIZONTAL){
        let addr = (address & 0x0BFF);
        this.vram[addr | (addr & 0x0800 >> 1)] = data;
      }
      else if (this.cartridge.info.mirror === Mirror.VERTRICAL){
        this.vram[address & 0x07FF] = data;
      }
    }
    else{
      // Palettes
      let addr = address & 0x001F;
      addr = (addr & 0x0003) === 0 ? addr & 0xFFF0 : addr;
      this.Pram[addr] = data;
    }
  }
  public readByte(address: uint16): uint8 {
    address &= 0x3FFF;
    if (address < 0x2000){
      // Cartridge Pattern Tables
      return this.cartridge.mapper.read(address);
    }
    else if (address < 0x3F00){
      // Name Tables VRAM
      if (this.cartridge.info.mirror === Mirror.HORIZONTAL){
        let addr = (address & 0x0BFF);
        return this.vram[addr | (addr & 0x0800 >> 1)];
      }
      else if (this.cartridge.info.mirror === Mirror.VERTRICAL){
        return this.vram[address & 0x07FF];
      }
    }
    else{
      // Palettes
      let addr = address & 0x001F;
      addr = (addr & 0x0003) === 0 ? addr & 0xFFF0 : addr;
      return this.Pram[addr];
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