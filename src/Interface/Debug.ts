export interface LOGS {
  PC: string;
  opCode: string;
  dataCode: string;
  opName: string;
  dataContent: string;
  A: string;
  X: string;
  Y: string;
  P: string;
  SP: string;
  PPU: string;
  CYC: string;
};

// Debug log
export var logTemplate = (
  logs:LOGS
) =>
`${logs.PC}  ${logs.opCode} ${logs.dataCode}` + " ".padStart(7-logs.dataCode.length) + 
`${logs.opName} ${logs.dataContent}` + " ".padStart(28-logs.dataContent.length) + 
`A:${logs.A} X:${logs.X} Y:${logs.Y} P:${logs.P} SP:${logs.SP} PPU:${logs.PPU} CYC:${logs.CYC}
`;

  