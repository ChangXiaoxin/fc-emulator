import { uint16, uint8 } from "./typedef";

export interface ICPU {
  clock(): void;

  reset(): void;
  irq(): void;
  nmi(): void;
}

export enum Flags {
  C = 1 << 0, // Carry
  Z = 1 << 1, // Zero
  I = 1 << 2, // Interrupt Disable
  D = 1 << 3, // Decimal
  B = 1 << 4, // (No CPU effect: B flag)
  U = 1 << 5, // (No CPU effect: always pushed as 1)
  V = 1 << 6, // Overflow
  N = 1 << 7, // Negative 
}

export interface IRegs {
  readonly A: uint8;
  readonly X: uint8;
  readonly Y: uint8;
  readonly PC: uint16;
  readonly S: uint8;
  readonly P: uint8;
}