import { debugCatchCPUBus } from "../Interface/Debug";
import { IEmulator, IOptions } from "../Interface/Emulator";
import { Cartridge } from "./cartridge";
import { CPU2A03 } from "./CPU2A03";
import { CPUBus } from "./CPUBus";

export class FCEmulator implements IEmulator {
  cpuBus:CPUBus;
  cpu:CPU2A03;
  constructor(fcData: Uint8Array, options?: IOptions, userData?: any){
    const cartridge = new Cartridge(fcData, new Uint8Array(8 * 1024));
    this.cpuBus = new CPUBus();
    this.cpu = new CPU2A03(userData);
    this.cpuBus.cartridge = cartridge;
    this.cpu.bus = this.cpuBus;
    
    debugCatchCPUBus(this.cpuBus);
  }

  public clock(): void {
    this.cpu.clock();
  }
}