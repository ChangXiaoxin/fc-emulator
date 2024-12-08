import { IEmulator, IOptions } from "../Interface/Emulator";
import { uint8 } from "../Interface/typedef";
import { Cartridge } from "./cartridge";
import { Controller } from "./controller";
import { CPU2A03 } from "./CPU2A03";
import { CPUBus } from "./CPUBus";
import { PPU2C02 } from "./PPU2C02";
import { PPUBus } from "./PPUBus";

export class FCEmulator implements IEmulator {
  public cpuBus:CPUBus;
  public cpu:CPU2A03;
  public ppuBus:PPUBus;
  public ppu: PPU2C02;
  public clocks: number;
  public option: IOptions;
  public controller: Controller;
  constructor(fcData: Uint8Array, options: IOptions){

    this.clocks = 0;
    this.option = options;
    const cartridge = new Cartridge(fcData, new Uint8Array(8 * 1024));
  
    this.ppuBus = new PPUBus();
    this.ppuBus.cartridge = cartridge;
    this.ppu = new PPU2C02(this.ppuBus);
    this.controller = new Controller();
    this.cpuBus = new CPUBus();
    this.cpuBus.controller = this.controller;
    this.cpuBus.cartridge = cartridge;
    this.cpuBus.ppu = this.ppu;
    this.cpu = new CPU2A03(this.cpuBus);
  }

  public clock(): void {
    this.ppu.clock();
    this.clocks += 1;
    if (this.clocks%3 === 0)
    {
      if(this.ppu.nmiReq){
        this.ppu.nmiReq = false;
        this.cpu.nmi();
        this.cpu.clock();
      }
      else if (this.cpuBus.DMAPupupu) {
        if (this.cpuBus.DMAEmpty) {
          if (this.clocks%2 === 1) {
            this.cpuBus.DMAEmpty = false;
          }
        }
        else {
          if (this.clocks%2 === 0) {
            this.cpuBus.DMAData = this.cpuBus.readByte((this.cpuBus.DMAPage<<8) | this.cpuBus.DMAAddr);
          }
          else {
            this.ppu.regs.OAMDATA[this.cpuBus.DMAAddr] = this.cpuBus.DMAData;
            this.cpuBus.DMAAddr++;
            if (this.cpuBus.DMAAddr === 0x100) {
              this.cpuBus.DMAPupupu = false;
              this.cpuBus.DMAEmpty = true;
            }
          }
        }
      }
      else {
        this.cpu.clock();
      }
    }
  }

  public reset(): void {
    this.cpu.reset();
    this.ppu.reset();
  }
}