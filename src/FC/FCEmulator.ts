import { debugCatchCPUBus } from "../Interface/Debug";
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
  constructor(fcData: Uint8Array, options?: IOptions){
    this.clocks = 0;

    const cartridge = new Cartridge(fcData, new Uint8Array(8 * 1024));
  
    this.cpuBus = new CPUBus();
    this.cpuBus.cartridge = cartridge;
    this.cpu = new CPU2A03(this.cpuBus);
    
    this.ppuBus = new PPUBus();
    this.ppu = new PPU2C02();
    this.ppuBus.cartridge = cartridge;
    this.ppu.bus = this.ppuBus;
    
    this.cpuBus.ppu = this.ppu;
    debugCatchCPUBus(this.cpuBus);
  }

  public clock(): void {
    this.clocks += 1;
    if (this.clocks%3 === 0)
    {
      this.cpu.clock();
    }
    this.ppu.clock();
  }
  public reset(): void {
    this.cpu.reset();
    this.ppu.reset();
  }
}