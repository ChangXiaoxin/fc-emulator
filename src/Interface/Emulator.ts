export interface IOptions {
  sampleRate: number;
  onSample: (volume: number) => void;
  onFrame: (image: Uint8Array) => void; // [r,g,b, r,g,b, ...] 256*240*3 = 184320 bytes
}

export interface IEmulator {
  clock(): void;
}