
export type uint8 = any;
export type uint16 = any;

export function checkBit(data: any, pos: number){
  return (data & (1 << pos)) === (1 << pos)
}