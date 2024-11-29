import { getCurrentPanel } from "../extension";


;

export function drawImage(image: Uint8Array){
  let panel = getCurrentPanel();
  panel?.webview.postMessage({imageData: image});
}