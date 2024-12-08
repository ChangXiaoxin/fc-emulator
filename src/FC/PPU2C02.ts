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

export class LOOPYREG{
  coarseX: uint8; // :5
  coarseY: uint8; // :5
  nametableX: uint8; // :1
  nametableY: uint8; // :1
  fineY: uint8; // :3
  unused: uint8; // :1
  constructor(){
    this.setloopy(0x0000);
  }
  public setloopy(data: uint16) {
    this.coarseX = data & 0x001F;
    data>>=5;
    this.coarseY = data & 0x001F;
    data>>=5;
    this.nametableX = data & 0x0001;
    data>>=1;
    this.nametableY = data & 0x0001;
    data>>=1;
    this.fineY = data & 0x0007;
    data>>=3;
    this.unused = data & 0x0001;
  }
  public getloopy() {
    return ((this.unused<<15) |
            (this.fineY<<12) |
            (this.nametableY<<11) |
            (this.nametableX<<10) |
            (this.coarseY<<5) |
            (this.coarseX)
           );
  }
}

export class PPUReg {
  CTRL: uint8;
  MASK: uint8;
  STATUS: uint8;
  OAMADDR: uint8;
  OAMDATA!: Uint8Array;
  DATA: uint8;
  OAMDMA: uint8;
}

export enum OAMINDEX {
  Y = 0,
  ID,
  ATTRIBUTE,
  X,
  SIZE,
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
  public displayOutput: Uint8Array = new Uint8Array(256*240*4).fill(0x00);
  private clocks = 0;
  private scanline = 0;
  private cycles = 0;
  public addressLatch = 0x00;
  public dataBuffer = 0x00;
  public regs = new PPUReg();
  public vramAddr = new LOOPYREG();
  public tramAddr = new LOOPYREG();
  public fineX = 0x00;
  public nmiReq = false;
  public oddFrame = false;
  public bgTileId:uint8 = 0x00;
  public bgTileAttrbi:uint8 = 0x00;
  public bgTileLsb:uint8 = 0x00;
  public bgTileMsb:uint8 = 0x00;
  public bgShifterPatternL:uint16 = 0x0000;
  public bgShifterPatternH:uint16 = 0x0000;
  public bgShifterAttribL:uint16 = 0x0000;
  public bgShifterAttribH:uint16 = 0x0000;
  public frameDone = false;
  public scanSprite: Uint8Array = new Uint8Array(8 * 4).fill(0);
  public spriteCount: uint8 = 0;
  public spriteShifterPatternL: Uint8Array = new Uint8Array(8).fill(0);
  public spriteShifterPatternH: Uint8Array = new Uint8Array(8).fill(0);
  public spriteZeroFound = false;
  public spriteZeroRendering = false;

  constructor(ppubus:PPUBus){
    this.bus = ppubus;
    this.clocks = 0;

    // Regs
    this.regs.CTRL = 0x00;
    this.regs.MASK = 0x00;
    this.regs.STATUS = 0x00;
    this.regs.OAMADDR = 0x00;
    this.regs.OAMDATA = new Uint8Array(64*OAMINDEX.SIZE).fill(0xFF);
    this.regs.OAMDMA = 0x00;
    this.regs.DATA = 0x00;
  }

  public reset(): void {
    this.clocks = 0;
    this.regs.CTRL = 0x00;
    this.regs.MASK = 0x00;
    this.regs.STATUS = 0x00;
    this.regs.DATA = 0x00;
    this.vramAddr.fineY = 0x00;
    this.vramAddr.coarseX = 0x00;
    this.vramAddr.coarseY = 0x00;
    this.tramAddr.fineY = 0x00;
    this.tramAddr.coarseX = 0x00;
    this.tramAddr.coarseY = 0x00;
    this.fineX = 0x00;
    this.addressLatch = 0x00;
    this.dataBuffer = 0x00;
    this.nmiReq = false;
    this.oddFrame = false;
    this.bgTileId = 0x00;
    this.bgTileAttrbi = 0x00;
    this.bgTileLsb = 0x00;
    this.bgTileMsb = 0x00;
    this.bgShifterPatternL = 0x0000;
    this.bgShifterPatternH = 0x0000;
    this.bgShifterAttribL = 0x0000;
    this.bgShifterAttribH = 0x0000;
    this.scanSprite.fill(0);
    this.spriteCount = 0;
    this.spriteShifterPatternL.fill(0);
    this.spriteShifterPatternH.fill(0);
    this.spriteZeroFound = false;
    this.spriteZeroRendering = false;
  }

  public clock(): void {

    this.clocks++;

    if (this.scanline === -1){
      if (this.cycles === 1){
        this.setStatusFlag(STATUSFlags.V, false);
        this.setStatusFlag(STATUSFlags.O, false);
        this.setStatusFlag(STATUSFlags.S, false);
        for (let i = 0; i < 8; i++) {
          this.spriteShifterPatternL[i] = 0x00;
          this.spriteShifterPatternH[i] = 0x00;
        }
      }
      else if ((this.isRendering()) && this.oddFrame && (this.cycles === 340)){
        // skip to 0, 0 when rendering enabled.
        this.scanline = 0;
        this.cycles = 0;
      }
    }

    if((this.scanline >= -1) && (this.scanline < 240)){

      if(((this.cycles >= 2) && (this.cycles < 258)) ||
         ((this.cycles >= 321) && (this.cycles < 338))){

        this.updateShifters();
        switch ((this.cycles-1) % 8){
          case 0:
            this.loadBgShifters();
            // read name table
            this.bgTileId = this.bus.readByte(0x2000 | (this.vramAddr.getloopy() & 0x0FFF));
            break;
          case 2:
            // read attribute table
            this.bgTileAttrbi = this.bus.readByte(0x23C0 | (this.vramAddr.nametableY << 11)
                                                         | (this.vramAddr.nametableX << 10)
                                                         | ((this.vramAddr.coarseY >> 2) << 3)
                                                         | (this.vramAddr.coarseX >> 2));
            if ((this.vramAddr.coarseY & 0x02) > 0){
              this.bgTileAttrbi >>= 4;
            }
            if ((this.vramAddr.coarseX & 0x02) > 0){
              this.bgTileAttrbi >>= 2;
            }
            this.bgTileAttrbi &= 0x03;
            break;
          case 4:
            // read lsb
            this.bgTileLsb = this.bus.readByte(((this.getCtrlFlag(CTRLFlags.B)?0x01:0x00) << 12)
                                              + (this.bgTileId << 4)
                                              + (this.vramAddr.fineY));
            break;
          case 6:
            // read msb
            this.bgTileMsb = this.bus.readByte(((this.getCtrlFlag(CTRLFlags.B)?0x01:0x00) << 12)
                                             + (this.bgTileId << 4)
                                             + (this.vramAddr.fineY) + 8);
            break;
          case 7:
            // increase hori(v)
            this.increaseScrollX();
            break;
        }

        if (this.cycles === 256){
          this.increaseScrollY();
        }
        else if (this.cycles === 257){
          this.transAddressX();
        }
      }
      if (this.scanline === -1){
        if ((this.cycles >= 280) && (this.cycles < 305)){
          this.transAddressY();
        }
      }
      if ((this.scanline === 338) || (this.scanline === 340)) {
        this.bgTileId = this.bus.readByte(0x2000 | (this.vramAddr.getloopy() & 0x0FFF));
      }

      /*********** Foreground rendering: Sprite *************/
      // TODO: Rendering the sprites in a precise cycle.
      if (this.cycles === 257 && this.scanline >=0){
        this.scanSprite.fill(0xFF);
        this.spriteCount = 0;
        let OAMIndex = 0;
        this.spriteZeroFound = false;
        let spriteHight = (this.getCtrlFlag(CTRLFlags.H) ? 16 : 8);
        this.spriteZeroFound = this.scanline - this.regs.OAMDATA[OAMINDEX.Y] >= 0;
        this.spriteZeroFound &&= this.scanline - this.regs.OAMDATA[OAMINDEX.Y] < spriteHight;
        while ((OAMIndex < 64) && (this.spriteCount < 9)) {
          let diff = this.scanline - this.regs.OAMDATA[OAMIndex*OAMINDEX.SIZE + OAMINDEX.Y];
          if ((diff >= 0) && (diff < spriteHight)){
            if (this.spriteCount < 8){
              for (let index = 0; index < OAMINDEX.SIZE; index++) {
                this.scanSprite[this.spriteCount*OAMINDEX.SIZE + index] = this.regs.OAMDATA[OAMIndex*OAMINDEX.SIZE + index];
              }
              this.spriteCount++;
            }
            else {
              this.setStatusFlag(STATUSFlags.O, true);
            }
          }
          OAMIndex++;
        }
      }
    }
    if (this.cycles === 340) {
      for (let i = 0; i < this.spriteCount*OAMINDEX.SIZE; i+=OAMINDEX.SIZE) {
        let spritePatternBitsL: uint8  = 0x00;
        let spritePatternBitsH: uint8  = 0x00;
        let spritePatternAddrL: uint16 = 0x0000;
        let spritePatternAddrH: uint16 = 0x0000;
        if (!this.getCtrlFlag(CTRLFlags.H)) {
          // 8*8 sprite
          if (!(this.scanSprite[i + OAMINDEX.ATTRIBUTE] & 0x80)){
            // Not flipped vertically
            spritePatternAddrL = ((this.getCtrlFlag(CTRLFlags.S) ? 0x01 : 0x00) << 12)
                                 |(this.scanSprite[i + OAMINDEX.ID] << 4)
                                 |((this.scanline - this.scanSprite[i + OAMINDEX.Y]) & 0x07);
          }
          else {
            // Filpped vertically
            spritePatternAddrL = ((this.getCtrlFlag(CTRLFlags.S) ? 0x01 : 0x00) << 12)
                                 |(this.scanSprite[i + OAMINDEX.ID] << 4)
                                 |(7 - (this.scanline - this.scanSprite[i + OAMINDEX.Y]) & 0x07);
          }
        }
        else {
          // 8*16 sprite
          if (!(this.scanSprite[i + OAMINDEX.ATTRIBUTE] & 0x80)){
            // Not flipped vertically
            if ((this.scanline - this.scanSprite[i + OAMINDEX.Y]) < 8) {
              // Reading top half
              spritePatternAddrL = ((this.scanSprite[i + OAMINDEX.ID] & 0x01) << 12)
                                 | ((this.scanSprite[i + OAMINDEX.ID] & 0xFE) << 4)
                                 | ((this.scanline - this.scanSprite[i + OAMINDEX.Y]) & 0x07);
            }
            else {
              // Reading bottom half
              spritePatternAddrL = ((this.scanSprite[i + OAMINDEX.ID] & 0x01) << 12)
                                 | (((this.scanSprite[i + OAMINDEX.ID] & 0xFE) + 1) << 4)
                                 | ((this.scanline - this.scanSprite[i + OAMINDEX.Y]) & 0x07);
            }
          }
          else {
            // Filpped vertically
            if ((this.scanline - this.scanSprite[i + OAMINDEX.Y]) < 8) {
              // Reading top half
              spritePatternAddrL = ((this.scanSprite[i + OAMINDEX.ID] & 0x01) << 12)
                                 | (((this.scanSprite[i + OAMINDEX.ID] & 0xFE) + 1) << 4)
                                 | (7 - (this.scanline - this.scanSprite[i + OAMINDEX.Y] & 0x07));
            }
            else {
              // Reading bottom half
              spritePatternAddrL = ((this.scanSprite[i + OAMINDEX.ID] & 0x01) << 12)
                                 | (((this.scanSprite[i + OAMINDEX.ID] & 0xFE)) << 4)
                                 | (7 - (this.scanline - this.scanSprite[i + OAMINDEX.Y] & 0x07));
            }
          }
        }
        spritePatternAddrH = spritePatternAddrL + 8;
        spritePatternBitsL = this.bus.readByte(spritePatternAddrL);
        spritePatternBitsH = this.bus.readByte(spritePatternAddrH);

        if (this.scanSprite[i + OAMINDEX.ATTRIBUTE] & 0x40) {
          spritePatternBitsL = this.flipByte(spritePatternBitsL);
          spritePatternBitsH = this.flipByte(spritePatternBitsH);
        }

        this.spriteShifterPatternL[i>>2] = spritePatternBitsL;
        this.spriteShifterPatternH[i>>2] = spritePatternBitsH;
      }
    }


    /************ Rendering *********************/
    let bgPixel = 0x00;
    let bgPalette = 0x00;
    if (this.isRenderingBg()){
      let bitMux = 0x8000 >> this.fineX;
      let piex0 = (this.bgShifterPatternL & bitMux) > 0 ? 0x01 : 0x00;
      let piex1 = (this.bgShifterPatternH & bitMux) > 0 ? 0x01 : 0x00;
      bgPixel = (piex1 << 1) | piex0;
      let palette0 = (this.bgShifterAttribL & bitMux) > 0 ? 0x01 : 0x00;
      let palette1 = (this.bgShifterAttribH & bitMux) > 0 ? 0x01 : 0x00;
      bgPalette = (palette1 << 1) | palette0;
    }

    let fgPixel = 0x00;
    let fgPalette = 0x00;
    let fgPriority = 0x00;
    if(this.isRenderingFg()) {
      this.spriteZeroRendering = false;

      for (let i = 0; i < this.spriteCount*OAMINDEX.SIZE; i+=OAMINDEX.SIZE){
        if (this.scanSprite[i + OAMINDEX.X]  === 0){
          let fgPixel0= (((this.spriteShifterPatternL[i>>2] & 0x80) > 0)? 0x01 : 0x00);
          let fgPixel1= (((this.spriteShifterPatternH[i>>2] & 0x80) > 0)? 0x01 : 0x00);
          fgPixel = (fgPixel1 << 1) | fgPixel0;

          fgPalette = (this.scanSprite[i + OAMINDEX.ATTRIBUTE] & 0x03) + 0x04;
          fgPriority = (this.scanSprite[i + OAMINDEX.ATTRIBUTE] & 0x20) === 0x00 ? 0x01 : 0x00;

          if (fgPixel !== 0) {
            if (i === 0) {
              this.spriteZeroRendering = true;
            }
            break;
          }
        }
      }
    }

    let pixel = 0x00;
    let palette = 0x00;
    if ((bgPixel === 0) && (fgPixel === 0)) {
      pixel = 0;
      palette = 0;
    }
    else if ((bgPixel > 0) && (fgPixel === 0)){
      pixel = bgPixel;
      palette = bgPalette;
    }
    else if ((bgPixel === 0) && (fgPixel > 0)){
      pixel = fgPixel;
      palette = fgPalette;
    }
    else if ((bgPixel > 0) && (fgPixel > 0)){
      if (fgPriority > 0) {
        pixel = fgPixel;
        palette = fgPalette;
      }
      else {
        pixel = bgPixel;
        palette = bgPalette;
      }

      if (this.spriteZeroFound && this.spriteZeroRendering) {
        if (this.isRendering() && this.cycles < 158) {
          if (!(this.getMaskFlag(MASKFlags.M) || this.getMaskFlag(MASKFlags.m))) {
            if ((this.cycles>=9)){
              this.setStatusFlag(STATUSFlags.S, true);
            }
          }
          else {
            if ((this.cycles>=1)) {
              this.setStatusFlag(STATUSFlags.S, true);
            }
          }
        }
      }
    }

    if ( (this.scanline >= 0 && this.scanline < 240)
      && ((this.cycles > 0) && (this.cycles < 257))){
      let colorIndex = 0x3F & this.bus.readByte(0x3F00 + palette*4 + pixel);
      let outputIndex = (this.scanline*256 + this.cycles - 1)*4;
      this.displayOutput[outputIndex + 0] = 0xFF & (this.ColorTable[colorIndex]>>16);
      this.displayOutput[outputIndex + 1] = 0xFF & (this.ColorTable[colorIndex]>>8);
      this.displayOutput[outputIndex + 2] = 0xFF & (this.ColorTable[colorIndex]>>0);
      this.displayOutput[outputIndex + 3] = 0xFF;
    }
    /************************************************/

    if (this.scanline === 241 && this.cycles === 1){
      this.setStatusFlag(STATUSFlags.V, true);
      if (this.getCtrlFlag(CTRLFlags.V)){
        this.nmiReq = true;
      }
    }

    this.cycles++;
    if (this.cycles >= 341){
      this.scanline++;
      this.cycles = 0;
    }
    if (this.scanline >= 261){
      this.scanline = -1;
      this.oddFrame = !this.oddFrame;
      this.frameDone = true;
    }
  }

  // flips a byte
  // https://stackoverflow.com/a/2602885
  public flipByte(b: uint8) {
    b = (b & 0xF0) >> 4 | (b & 0x0F) << 4;
    b = (b & 0xCC) >> 2 | (b & 0x33) << 2;
    b = (b & 0xAA) >> 1 | (b & 0x55) << 1;
    return b;
  }

  public increaseScrollX(){
    if (this.isRendering()){
      if (this.vramAddr.coarseX === 31){
        this.vramAddr.coarseX = 0;
        this.vramAddr.nametableX = !this.vramAddr.nametableX;
      }
      else{
        this.vramAddr.coarseX++;
      }
    }
  }
  public increaseScrollY(){
    if (this.isRendering()){
      if (this.vramAddr.fineY < 7){
        this.vramAddr.fineY++;
      }
      else{
        this.vramAddr.fineY = 0;
        if (this.vramAddr.coarseY === 29){
          this.vramAddr.coarseY = 0;
          this.vramAddr.nametableY = !this.vramAddr.nametableY;
        }
        else if (this.vramAddr.coarseY === 31){
          this.vramAddr.coarseY = 0;
        }
        else{
          this.vramAddr.coarseY++;
        }
      }
    }
  }
  public transAddressX(){
    if (this.isRendering()){
      this.vramAddr.nametableX = this.tramAddr.nametableX;
      this.vramAddr.coarseX = this.tramAddr.coarseX;
    }
  }
  public transAddressY(){
    if (this.isRendering()){
      this.vramAddr.nametableY = this.tramAddr.nametableY;
      this.vramAddr.coarseY = this.tramAddr.coarseY;
      this.vramAddr.fineY = this.tramAddr.fineY;
    }
  }
  public loadBgShifters(){
    this.bgShifterPatternL = (this.bgShifterPatternL & 0xFF00) | (this.bgTileLsb);
    this.bgShifterPatternH = (this.bgShifterPatternH & 0xFF00) | (this.bgTileMsb);
    this.bgShifterAttribL = (this.bgShifterAttribL & 0xFF00) | (((this.bgTileAttrbi & 0x01) > 0) ? 0xFF : 0x00);
    this.bgShifterAttribH = (this.bgShifterAttribH & 0xFF00) | (((this.bgTileAttrbi & 0x02) > 0) ? 0xFF : 0x00);
  }
  public updateShifters(){
    if (this.isRenderingBg()){
      this.bgShifterPatternL = 0xFFFF & (this.bgShifterPatternL << 1);
      this.bgShifterPatternH = 0xFFFF & (this.bgShifterPatternH << 1);
      this.bgShifterAttribL  = 0xFFFF & (this.bgShifterAttribL  << 1);
      this.bgShifterAttribH  = 0xFFFF & (this.bgShifterAttribH  << 1);
    }
    if (this.isRenderingFg() && (this.cycles >= 1) && (this.cycles < 258)){
      for (let i = 0; i < this.spriteCount*4; i+=4) {
        if (this.scanSprite[i + OAMINDEX.X] > 0) {
          this.scanSprite[i + OAMINDEX.X]--;
        }
        else {
          this.spriteShifterPatternL[i>>2] = 0xFF & (this.spriteShifterPatternL[i>>2] << 1);
          this.spriteShifterPatternH[i>>2] = 0xFF & (this.spriteShifterPatternH[i>>2] << 1);
        }
      }
    }
  }

  public isRendering(){
    return (this.getMaskFlag(MASKFlags.b) || this.getMaskFlag(MASKFlags.s));
  }
  public isRenderingBg(){
    return this.getMaskFlag(MASKFlags.b);
  }
  public isRenderingFg(){
    return this.getMaskFlag(MASKFlags.s);
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