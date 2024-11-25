import { IMapper } from "../Interface/Mapper";
import { Mapper0 } from "./mapper0";
import { checkBit } from "../Interface/typedef";

export enum Mirror {
  HORIZONTAL,
  VERTRICAL,
  FOUR_SCREEN,
  SINGLE_SCREEN_LOWER_BANK,
  SINGLE_SCREEN_UPPER_BANK,
}

export enum HEADER_INDEX {
  PRG = 4,
  CHR = 5,
  Flag1 = 6,
  Flag2 = 7,
}

export interface IROMInfo {
  prg: number; // 16KB unit
  chr: number; // 8KB  unit
  mapper: number; // mapper number
  mirror: Mirror; // Mirror
  hasBatteryBacked: boolean; // battery backed
  isTrainer: boolean;
}

export class Cartridge {
  public readonly mapper: IMapper = {} as any;
  public readonly info: IROMInfo = {} as any;

  constructor(
    data: Uint8Array, // FC file data
    sram: Uint8Array, // 8K SRAM 
  ){
    // analize FC header to info
    if (data[0] !== 0x4e || data[1] !== 0x45 || data[2] !== 0x53 || data[3] !== 0x1A)
    {
      throw new Error(`Unsupported ROM: ` + data.slice(0, 5));
    }
    this.info.prg = data[HEADER_INDEX.PRG];
    this.info.chr = data[HEADER_INDEX.CHR];
    this.info.mirror = checkBit(data[HEADER_INDEX.Flag1], 0) ? Mirror.VERTRICAL : Mirror.HORIZONTAL;
    this.info.hasBatteryBacked = checkBit(data[HEADER_INDEX.Flag1], 1);
    this.info.isTrainer = checkBit(data[HEADER_INDEX.Flag1], 2);
    this.info.mirror = checkBit(data[HEADER_INDEX.Flag1], 3) ? Mirror.FOUR_SCREEN : this.info.mirror;
    this.info.mapper = ((data[HEADER_INDEX.Flag1] >> 4) & 0x0F) |
                        (data[HEADER_INDEX.Flag2] & 0xF0);
    let prg_begin = this.info.isTrainer ? 16 + 512 : 16;
    let prg_end = prg_begin + this.info.prg * 16 * 1024;
    let chr_begin = prg_end;
    let chr_end = chr_begin + this.info.chr * 8 * 1024;
    
    // read data to mapper
    switch (this.info.mapper){
      case 0:
        this.mapper = new Mapper0(sram, data.slice(prg_begin, prg_end), data.slice(chr_begin, chr_end));
        break;
      default:
        throw new Error(`Unsupported mapper: ${this.info.mapper}`);
    }
  }
}