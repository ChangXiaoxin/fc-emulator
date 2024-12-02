import { IEmulator, IOptions } from "../Interface/Emulator";
import { Cartridge } from "./cartridge";
import { CPU2A03 } from "./CPU2A03";
import { CPUBus } from "./CPUBus";
import { PPU2C02 } from "./PPU2C02";
import { PPUBus } from "./PPUBus";

export class FCEmulator implements IEmulator {
  cpuBus:CPUBus;
  cpu:CPU2A03;
  ppuBus:PPUBus;
  ppu: PPU2C02;
  clocks: number;
  option: IOptions;
  constructor(fcData: Uint8Array, options: IOptions){
    this.clocks = 0;
    this.option = options;
    const cartridge = new Cartridge(fcData, new Uint8Array(8 * 1024));
  
    this.ppuBus = new PPUBus();
    this.ppuBus.cartridge = cartridge;
    this.ppu = new PPU2C02(this.ppuBus);
    
    this.cpuBus = new CPUBus();
    this.cpuBus.cartridge = cartridge;
    this.cpuBus.ppu = this.ppu;
    this.cpu = new CPU2A03(this.cpuBus);


  }

  public clock(): void {
    if(this.ppu.nmiReq){
      this.ppu.nmiReq = false;
      this.cpu.nmi();
    }

    this.clocks += 1;
    this.ppu.clock();
    if (this.clocks%3 === 0)
    {
      this.cpu.clock();
    }
  }

  public reset(): void {
    this.cpu.reset();
    this.ppu.reset();
  }
}