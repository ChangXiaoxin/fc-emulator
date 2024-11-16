import { IBus } from "../Interface/Bus";
import { ICartridge } from "../Interface/Cartridge";
import { uint16, uint8 } from "../Interface/typedef";

export class CPUBus implements IBus {
  public cartridge!: ICartridge;

  private readonly ram = new Uint8Array(2 * 1024);
  
  public writeByte(address: uint16, data: uint8): void {
    if (address < 0x2000){
      // RAM
      this.ram[address & 0x07FF] = data;
    }
    else if (address < 0x6000){
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
      return this.ram[address * 0x07FF];
    }
    else if (address < 0x6000){
      // IO Registers
      return 0;
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