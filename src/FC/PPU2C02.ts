import { sourceMapsEnabled } from "process";
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

export enum STATUSFlags {
  O = 1 << 5, // sprite overflow
  S = 1 << 6, // sprite 0 hit
  V = 1 << 7, // vblank
}

export class PPUReg {
  CTRL: uint8;
  MASK: uint8;
  STATUS: uint8;
  OAMADDR: uint8;
  OAMDATA: uint8;
  SCROLL: uint16;
  ADDR: uint16;
  DATA: uint8;
  OAMDMA: uint8;
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
  public displayOutput:Uint8Array = new Uint8Array(256*240*4).fill(0x00);
  private clocks = 0;
  private scanline = 0;
  private cycles = 0;
  public addressLatch = 0x00;
  public dataBuffer = 0x00;
  public regs = new PPUReg();
  public nmiReq = false;
  public oddFrame = false;
  public palettesIndex = 0;

  constructor(ppubus:PPUBus){
    this.bus = ppubus;
    this.clocks = 0;

    // Regs
    this.regs.CTRL = 0x00;
    this.regs.MASK = 0x00;
    this.regs.STATUS = 0x00;
    this.regs.OAMADDR = 0x00;
    this.regs.OAMDATA = 0x00;
    this.regs.OAMDMA = 0x00;
    this.regs.SCROLL = 0x0000;
    this.regs.ADDR = 0x0000;
    this.regs.DATA = 0x00;
    this.addressLatch = 0x00;
    this.dataBuffer = 0x00;
    this.oddFrame = false;
  }

  public reset(): void {
    this.clocks = 0;
    this.regs.CTRL = 0x00;
    this.regs.MASK = 0x00;
    this.regs.STATUS = 0x00;
    this.regs.SCROLL = 0x0000;
    this.regs.DATA = 0x00;
    this.addressLatch = 0x00;
    this.dataBuffer = 0x00;
    this.nmiReq = false;
    this.oddFrame = false;
  }

  public clock(): void {
    this.clocks++;

    if (this.scanline === -1 && this.cycles === 1){
      this.setStatusFlag(STATUSFlags.V, false);
    }

    if (this.scanline === 241 && this.cycles === 1){
      this.setStatusFlag(STATUSFlags.V, true);
      if (this.getCtrlFlag(CTRLFlags.V)){
        this.nmiReq = true;
      }
    }

    if ((this.getMaskFlag(MASKFlags.b) || this.getMaskFlag(MASKFlags.s))&& this.oddFrame && (this.scanline === -1) && (this.cycles === 340)){
      // skip to 0, 0 when rendering enabled.
      this.scanline = 0;
      this.cycles = 0;
    }

    let colorGet = false;
    if((this.scanline >= 0) && (this.scanline < 240)){
      if((this.cycles >= 0) && (this.cycles < 256)){
        switch (this.cycles % 8){
          case 1:
            break;
          case 3:
            break;
          case 5:
            break;
          case 7:
            break;
        }

        let tile_index_x = Math.floor(this.cycles/8);
        let tile_index_y = Math.floor(this.scanline/8);
        let tile_x = this.cycles%8;
        let tile_y = this.scanline%8;
        let address = tile_index_y*32 + tile_index_x;
        // let tile = this.bus.readByte(0x2000 + address) + 16*16;
        let tile = this.bus.readByte(0x2000 + address);
        let tileMSB = this.bus.readByte(tile*16 + tile_y + 8);
        let tileLSB = this.bus.readByte(tile*16 + tile_y);
        let colorIndex = 0x3F & this.bus.readByte(0x3F00 + this.palettesIndex*4 + ((tileMSB >> (7 - tile_x) & 0x01) << 1) + ((tileLSB >> (7 - tile_x)) & 0x01));

        this.displayOutput[(this.scanline*256 + this.cycles)*4 + 0] = 0xFF & (this.ColorTable[colorIndex]>>16);
        this.displayOutput[(this.scanline*256 + this.cycles)*4 + 1] = 0xFF & (this.ColorTable[colorIndex]>>8);
        this.displayOutput[(this.scanline*256 + this.cycles)*4 + 2] = 0xFF & (this.ColorTable[colorIndex]>>0);
        this.displayOutput[(this.scanline*256 + this.cycles)*4 + 3] = 0xFF;
        colorGet = true;

        if (!colorGet){
          let piex = Math.random() > 0.5;
          let index = piex ? 0x2D : 0x20;
          this.displayOutput[(this.scanline*256 + this.cycles)*4 + 0] = 0xFF & (this.ColorTable[index]>>16);
          this.displayOutput[(this.scanline*256 + this.cycles)*4 + 1] = 0xFF & (this.ColorTable[index]>>8);
          this.displayOutput[(this.scanline*256 + this.cycles)*4 + 2] = 0xFF & (this.ColorTable[index]>>0);
          this.displayOutput[(this.scanline*256 + this.cycles)*4 + 3] = 0xFF;
        }
      }
    }

    this.cycles++;
    {if (this.cycles >= 341){
      this.scanline++;
      this.cycles = 0;
    }}
    if (this.scanline >= 261){
      this.scanline = -1;
      this.oddFrame = !this.oddFrame;
    }
  }


  public setStatusFlag(flag: STATUSFlags, set: boolean){
    if (set){
      this.regs.STATUS |= flag;
    }
    else{
      this.regs.STATUS &= ~flag;
    }
  }
  public getStatusFlag(flag: STATUSFlags){
    return (this.regs.STATUS & flag) === flag;
  }
  public setMaskFlag(flag: MASKFlags, set: boolean){
    if (set){
      this.regs.MASK |= flag;
    }
    else{
      this.regs.MASK &= ~flag;
    }
  }
  public getMaskFlag(flag: MASKFlags){
    return (this.regs.MASK & flag) === flag;
  }
  public setCtrlFlag(flag: CTRLFlags, set: boolean){
    if (set){
      this.regs.CTRL |= flag;
    }
    else{
      this.regs.CTRL &= ~flag;
    }
  }
  public getCtrlFlag(flag: CTRLFlags){
    return (this.regs.CTRL & flag) === flag;
  }
}