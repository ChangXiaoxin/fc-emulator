import { IMapper } from "../Interface/Mapper";
import { uint16, uint8 } from "../Interface/typedef";

export class Mapper0 implements IMapper {
  private readonly isMirrored: boolean;

  constructor(
    private readonly ram: Uint8Array, // 8K SRAM
    private readonly prg: Uint8Array, // prg data
    private readonly chr: Uint8Array, // chr data
  ){
    this.isMirrored = prg.length === 16 * 1024;

    if (chr.length === 0){
        this.chr = new Uint8Array(0x2000);
    }
  }
  public read(address: uint16): uint8 {
    address &= 0xFFFF;
    if (address < 0x2000){
      // CHR
      return this.chr[address];
    }
    else if (address >= 0x8000){
      // PRG
      return this.prg[(this.isMirrored ? address & 0xBFFF: address) - 0x8000];
    }
    else if (address >= 0x6000){
      // SRAM
      return this.ram[address - 0x6000];
    }
    return 0;
  }
  public write(address: uint16, data: uint8): void {
    address &= 0xFFFF;
    data &= 0xFF;
    if (address < 0x2000){
      // CHR
      this.chr[address] = data;
    }
    else if (address >= 0x8000){
      // PRG
      this.prg[(this.isMirrored ? address & 0xBFFF: address) - 0x8000] = data;
    }
    else if (address >= 0x6000){
      // SRAM
      this.ram[address - 0x6000] = data;
    }
  }
}
