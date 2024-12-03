// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import path from 'path';
import { FCEmulator } from './FC/FCEmulator';
import { IOptions } from "./Interface/Emulator";
import { drawImage } from './FC/display';
import { debugCatchCPUBus, debugCatchDrawColorTable, debugCatchDrawLog, debugCatchDrawPalette, debugCatchDrawPatternTables, debugCatchLogPath, debugCatchPPUBus } from './Interface/Debug';
import { MASKFlags, PPU2C02 } from './FC/PPU2C02';

let currentPanel: vscode.WebviewPanel | undefined = undefined;
let running:boolean = false;
let runstep:boolean = true;
let refreshPatternTable:boolean = false;
let runInterval = 17;
let palettesIndex = 0;
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('FC Emulator is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  context.subscriptions.push(vscode.commands.registerCommand('fc-emulator.pause', () => {
    running = !running;
    runstep = !running;
  }));
  context.subscriptions.push(vscode.commands.registerCommand('fc-emulator.step', () => {
    runstep = true;
  }));
  context.subscriptions.push(vscode.commands.registerCommand('fc-emulator.refreshPatternTable', () => {
    refreshPatternTable = true;
  }));
  context.subscriptions.push(vscode.commands.registerCommand('fc-emulator.movePalettes', () => {
    palettesIndex++;
    if (palettesIndex > 7){
      palettesIndex= 0;
    }
  }));
  context.subscriptions.push(vscode.commands.registerCommand('fc-emulator.RunFCEmulator', () => {
    // The code you place here will be executed every time your command is executed
    if (currentPanel){
      currentPanel.reveal(vscode.ViewColumn.One);
    }
    else{
      currentPanel = vscode.window.createWebviewPanel(
      'FCEmulator',
      'FC Emulator',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
      );
    }
    const realPath = path.join(context.extensionPath, 'src', 'webView', 'index.html');
    const realJsPath = currentPanel.webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, 'src', 'webView', 'index.js')
    );
    currentPanel.webview.html = fs.readFileSync(realPath).toString().replace('SOURCE_PATH_PLACEHOLDER', realJsPath as any);
    currentPanel.onDidDispose(
      () => {
      currentPanel = undefined;
      clearInterval(intervalEmulator);
      clearInterval(intervalPatternTable);
      running = false;
      runstep = true;
	    refreshPatternTable = false;
      }
    );
      // Display a message box to the user
    vscode.window.showInformationMessage('Run FC Emulator from FC Emulator!');

    const fc_options: IOptions ={
      sampleRate: 0,
      onSample: (volume: number) => void{

      },
      onFrame: (frame: Uint8Array) =>
      drawImage(frame),
    };
    // const rom_path = path.join(context.extensionPath, 'src', 'test', 'Super Mario Bros.nes');
    const rom_path = path.join(context.extensionPath, 'src', 'test', 'nestest.nes');
    var fc_data = fs.readFileSync(rom_path);
    // Debug log
    const log_path = path.join(context.extensionPath, 'src', 'test', 'run.log');
    fs.writeFileSync(log_path, "");
    debugCatchLogPath(log_path);

    let fcEmulator = new FCEmulator(fc_data, fc_options);
    const runEmulator = () =>{
      // hackin
      fcEmulator.ppu.palettesIndex = palettesIndex;

      // 60 Hz
      if (fcEmulator.clocks%3 === 0){
        runInterval = 16;
      }
      else{
        runInterval = 17;
      }

      // clocks for 1 frame
      let runclock = 341*262;
      if((fcEmulator.ppu.getMaskFlag(MASKFlags.b) || fcEmulator.ppu.getMaskFlag(MASKFlags.s))&& fcEmulator.ppu.oddFrame ){
        runclock--;
      }
      while(runclock--){
        if(running)
        {
          fcEmulator.clock();
        }
        else if(runstep){
          if(fcEmulator.clocks !== 0 && fcEmulator.clocks%3 === 0 && fcEmulator.cpu.deferCycles === 0){
            runstep = false;
            runclock = 0;
          }
          fcEmulator.clock();
        }
      }
      fcEmulator.option.onFrame(fcEmulator.ppu.displayOutput);

      // draw debug information.
      debugCatchDrawPalette(fcEmulator.ppu.ColorTable, palettesIndex);
      debugCatchDrawPatternTables(fcEmulator.ppu.ColorTable, 0x00, palettesIndex);
      debugCatchDrawPatternTables(fcEmulator.ppu.ColorTable, 0x01, palettesIndex);
      debugCatchDrawLog();
    };
    const intervalEmulator = setInterval(runEmulator, runInterval);

    debugCatchCPUBus(fcEmulator.cpuBus);
	  debugCatchPPUBus(fcEmulator.ppuBus);
	  const updatePatternTable = () =>{
		if(refreshPatternTable){
			refreshPatternTable = false;
			debugCatchDrawPatternTables(fcEmulator.ppu.ColorTable, 0x00, palettesIndex);
			debugCatchDrawPatternTables(fcEmulator.ppu.ColorTable, 0x01, palettesIndex);
		}
	};
  const intervalPatternTable = setInterval(updatePatternTable, 1000);
	debugCatchDrawColorTable(fcEmulator.ppu.ColorTable);
  }));
}

// This method is called when your extension is deactivated
export function deactivate() {}

export function getCurrentPanel(){
  return currentPanel;
}
