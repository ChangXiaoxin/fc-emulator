import { uint16, uint8 } from "./typedef";

export interface IBus {
  readByte(address: uint16): uint8;
  writeByte(address: uint16, data: uint8): void;
  readWord(address: uint16): uint16;
  writeWord(address: uint16, data: uint16): void;
}