import { uint16, uint8 } from "../Interface/typedef";
import { PPUBus } from "./PPUBus";

export enum CTRLFlags {
  n = 1 << 0, // nametable select / X and Y scroll bit 8 
  N = 1 << 1, // nametable select / X and Y scroll bit 8 
  I = 1 << 2, // increment mode
  S = 1 << 3, // sprite tile select
  B = 1 << 4, // background tile select
  H = 1 << 5, // sprite height
  P = 1 << 6, // master/slaBe
  V = 1 << 7, // NMI enable 
}
export enum MASKFlags {
  g = 1 << 0, // greyscale
  m = 1 << 1, // background left column enable
  M = 1 << 2, // sprite left column enable
  b = 1 << 3, // background enable
  s = 1 << 4, // sprite enable
  R = 1 << 5, // color emphasis (BGR)
  G = 1 << 6, //
  B = 1 << 7, //
}

export enum MASKFlags {
  O = 1 << 5, // sprite overflow
  S = 1 << 6, // sprite 0 hit
  V = 1 << 7, // vblank
}

export enum PPUReg {
  CTRL = 0,
  MASK,   
  STATUS,
  OAMADDR,
  OAMDATA,
  SCROLL,
  ADDR,
  DATA,   
  OAMDMA,
  PPURegSize,
}

export class PPU2C02{
  public bus!: PPUBus;
  ColorTable = [0x626262, 0x012090, 0x240BA0, 0x470090, 0x600062, 0x6A0024, 0x601100, 0x472700,
                0x243C00, 0x014A00, 0x004F00, 0x004724, 0x003662, 0x000000, 0x000000, 0x000000,
                0xABABAB, 0x1F56E1, 0x4D39FF, 0x7E23EF, 0xA31BB7, 0xB42264, 0xAC370E, 0x8C5500,
                0x5E7200, 0x2D8800, 0x079000, 0x008947, 0x00739D, 0x000000, 0x000000, 0x000000,
                0xFFFFFF, 0x67ACFF, 0x958DFF, 0xC875FF, 0xF26AFF, 0xFF6FC5, 0xFF836A, 0xE6A01F,
                0xB8BF00, 0x85D801, 0x5DE335, 0x45DE88, 0x49CAE3, 0x4E4E4E, 0x000000, 0x000000,
                0xFFFFFF, 0xBFE0FF, 0xD1D3FF, 0xE6C9FF, 0xF7C3FF, 0xFFC4EE, 0xFFCBC9, 0xF7D7A9,
                0xE6E397, 0xD1EE97, 0xBFF3A9, 0xB5F2C9, 0xB5EBEE, 0xB8B8B8, 0x000000, 0x000000];

  private deferCycles = 0;
  private clocks = 0;
  public readonly regs = new Uint8Array(PPUReg.PPURegSize).fill(0);

  constructor(ppubus:PPUBus){
    this.bus = ppubus;
    this.deferCycles = 0;
    this.clocks = 0;

    // Regs

  }

  public reset(): void {
    
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
  public step():void {
    
  }
}