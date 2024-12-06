import { getCurrentPanel } from "../extension";

export function convertPixelImageToRGBImage(){

}

export function drawImage(image: Uint8Array){
  let panel = getCurrentPanel();
  panel?.webview.postMessage({imageData: image});
}

export function drawColorPalettes(palettes: Uint8Array){
  let panel = getCurrentPanel();
  panel?.webview.postMessage({ColorPalettes: palettes});
}

export function drawPalettes(palettes: Uint8Array){
  let panel = getCurrentPanel();
  panel?.webview.postMessage({Palettes: palettes});
}

export function drawPatternTables(palettes: Uint8Array, index: number){
  let panel = getCurrentPanel();
  if(index === 0x00){
    panel?.webview.postMessage({patternImage: palettes});
  }
  else if (index === 0x01){
    panel?.webview.postMessage({patternImage2: palettes});
  }
}
export function drawNameTables(palettes: Uint8Array){
  let panel = getCurrentPanel();
  panel?.webview.postMessage({nameTable: palettes});
}
export function drawLogs(logs:string[]){
  let panel = getCurrentPanel();
  panel?.webview.postMessage({CPULOG: logs});
}
