import { getCurrentPanel } from "../extension";

let panel:any = undefined;
export function getCurrentPanelForDisplay(){
  panel = getCurrentPanel();
}


export function debugCatchTime(date: number[]){
  panel?.webview.postMessage({dateInfo: date});
}

export function drawOAMData(OAMdata: Uint8Array) {
  panel?.webview.postMessage({oamData: OAMdata});
}

export function displayControllerInput(input: Uint8Array){
  panel?.webview.postMessage({controllerInput: input});
}

export function drawImage(image: Uint8Array){
  panel?.webview.postMessage({imageData: image});
}

export function drawColorPalettes(palettes: Uint8Array){
  panel?.webview.postMessage({ColorPalettes: palettes});
}

export function drawPalettes(palettes: Uint8Array){
  panel?.webview.postMessage({Palettes: palettes});
}

export function drawPatternTables(palettes: Uint8Array, index: number){
  if(index === 0x00){
    panel?.webview.postMessage({patternImage: palettes});
  }
  else if (index === 0x01){
    panel?.webview.postMessage({patternImage2: palettes});
  }
}
export function drawNameTables(palettes: Uint8Array){
  panel?.webview.postMessage({nameTable: palettes});
}
export function drawLogs(logs:string[]){
  panel?.webview.postMessage({CPULOG: logs});
}
