import { IEmulator, IOptions } from "../Interface/Emulator";
import { Cartridge } from "./cartridge";
import { CPU_2A03 } from "./CPU_2A03";
import { CPUBus } from "./CPUBus";

export class FC_Emulator implements IEmulator {
  cpuBus:CPUBus;
  cpu2A03:CPU_2A03;
  constructor(fcData: Uint8Array, options?: IOptions, userData?: any){
    const cartridge = new Cartridge(fcData, new Uint8Array(8 * 1024));
    this.cpuBus = new CPUBus();
    this.cpu2A03 = new CPU_2A03(userData);
    this.cpuBus.cartridge = cartridge;
    this.cpu2A03.bus = this.cpuBus;
  }

  public clock(): void {
    this.cpu2A03.clock();
  }
}