import { IMapper } from "./Mapper";
import { IROMInfo } from "./ROMInfo";

export interface ICartridge {
  readonly info: IROMInfo;
  readonly mapper: IMapper;
}
