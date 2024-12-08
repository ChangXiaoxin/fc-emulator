import { getCurrentPanel } from "../extension";
import { uint8 } from "../Interface/typedef";

export enum CTRLBUTTON {
    RIGHT = 1 << 0, //
    LEFT = 1 << 1, //
    DOWN = 1 << 2, //
    UP = 1 << 3, //
    START = 1 << 4, //
    SELECT = 1 << 5, //
    B = 1 << 6, //
    A = 1 << 7, //
  }

export class Controller {
  public ctrlState = new Uint8Array(2).fill(0);

  public setCtrlState(index: uint8, button: CTRLBUTTON, value: uint8){
    if(value){
      this.ctrlState[index] |= button;
    }
    else{
      this.ctrlState[index] &= ~button;
    }
  }
}


export function getControllerInput(controller: Controller, keypressed: string, keyreleased: string){
    let controllernum = 0;
    switch (keypressed) {
      case 'KeyA':
        controller.setCtrlState(controllernum, CTRLBUTTON.LEFT, true);
        break;
      case 'KeyD':
        controller.setCtrlState(controllernum, CTRLBUTTON.RIGHT, true);
        break;
      case 'KeyW':
        controller.setCtrlState(controllernum, CTRLBUTTON.UP, true);
        break;
      case 'KeyS':
        controller.setCtrlState(controllernum, CTRLBUTTON.DOWN, true);
        break;
      case 'KeyG':
        controller.setCtrlState(controllernum, CTRLBUTTON.SELECT, true);
        break;
      case 'KeyH':
        controller.setCtrlState(controllernum, CTRLBUTTON.START, true);
        break;
      case 'KeyJ':
        controller.setCtrlState(controllernum, CTRLBUTTON.B, true);
        break;
      case 'KeyK':
        controller.setCtrlState(controllernum, CTRLBUTTON.A, true);
        break;
    }
    switch (keyreleased) {
      case 'KeyA':
        controller.setCtrlState(controllernum, CTRLBUTTON.LEFT, false);
        break;
      case 'KeyD':
        controller.setCtrlState(controllernum, CTRLBUTTON.RIGHT, false);
        break;
      case 'KeyW':
        controller.setCtrlState(controllernum, CTRLBUTTON.UP, false);
        break;
      case 'KeyS':
        controller.setCtrlState(controllernum, CTRLBUTTON.DOWN, false);
        break;
      case 'KeyG':
        controller.setCtrlState(controllernum, CTRLBUTTON.SELECT, false);
        break;
      case 'KeyH':
        controller.setCtrlState(controllernum, CTRLBUTTON.START, false);
        break;
      case 'KeyJ':
        controller.setCtrlState(controllernum, CTRLBUTTON.B, false);
        break;
      case 'KeyK':
        controller.setCtrlState(controllernum, CTRLBUTTON.A, false);
        break;
    }
}