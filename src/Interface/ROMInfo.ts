export enum Mirror {
  HORIZONTAL,
  VERTRICAL,
  FOUR_SCREEN,
  SINGLE_SCREEN_LOWER_BANK,
  SINGLE_SCREEN_UPPER_BANK,
}

export enum HEADER_INDEX {
  PRG = 4,
  CHR = 5,
  Flag1 = 6,
  Flag2 = 7,
}

export interface IROMInfo {
  prg: number; // 16KB unit
  chr: number; // 8KB  unit
  mapper: number; // mapper number
  mirror: Mirror; // Mirror
  hasBatteryBacked: boolean; // battery backed
  isTrainer: boolean;
}
