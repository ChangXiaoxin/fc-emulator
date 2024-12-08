// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import path from 'path';
import { FCEmulator } from './FC/FCEmulator';
import { IOptions } from "./Interface/Emulator";
import { debugCatchTime, displayControllerInput, drawImage, getCurrentPanelForDisplay } from './FC/display';
import { debugCatchCPUBus, debugCatchDrawColorTable, debugCatchDrawLog, debugCatchDrawNameTables, debugCatchDrawPalette, debugCatchDrawPatternTables, debugCatchLogPath, debugCatchOAMData, debugCatchPPUBus } from './Interface/Debug';
import { getControllerInput } from './FC/controller';

let currentPanel: vscode.WebviewPanel | undefined = undefined;
let currentFC: FCEmulator | undefined = undefined;
let currentTimer: any | undefined = undefined;
let running:boolean = true;
let runstep:boolean = true;
let runInterval = 15;
let palettesIndex = 0;
let dateLast = Date.now();
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
      getCurrentPanelForDisplay();
    }
    const realPath = path.join(context.extensionPath, 'src', 'webView', 'index.html');
    const realJsPath = currentPanel.webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, 'src', 'webView', 'index.js')
    );
    currentPanel.webview.html = fs.readFileSync(realPath).toString().replace('SOURCE_PATH_PLACEHOLDER', realJsPath as any);
    currentPanel.onDidDispose(
      () => {
        currentPanel = undefined;
        currentFC = undefined;
        clearInterval(currentTimer);
        running = false;
        runstep = true;
      }
    );
    // Handle messages from the webview
    currentPanel.webview.onDidReceiveMessage(
      message => {
        getControllerInput(fcEmulator.controller, message.keypressed, message.keyreleased);
      },
      undefined,
      context.subscriptions
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
    // const rom_path = path.join(context.extensionPath, 'src', 'testRom/ppu/rom_singles', '02-vbl_set_time.nes');
    const rom_path = path.join(context.extensionPath, 'src', 'test', 'Super Mario Bros.nes');
    // const rom_path = path.join(context.extensionPath, 'src', 'test', '(J) Ice Climber.nes');
    // const rom_path = path.join(context.extensionPath, 'src', 'test', 'kung.nes');
    // const rom_path = path.join(context.extensionPath, 'src', 'test', '(Ch) Tank 1990.nes');
    // const rom_path = path.join(context.extensionPath, 'src', 'test', 'nestest.nes');
    var fc_data = fs.readFileSync(rom_path);
    // Debug log
    // const log_path = path.join(context.extensionPath, 'src', 'test', 'run.log');
    // fs.writeFileSync(log_path, "");
    // debugCatchLogPath(log_path);

    if (!currentFC){
      currentFC = new FCEmulator(fc_data, fc_options);

      debugCatchCPUBus(currentFC.cpuBus);
      debugCatchPPUBus(currentFC.ppuBus);
      // debugCatchDrawColorTable(currentFC.ppu.ColorTable);
    }
    let fcEmulator = currentFC;
    const runEmulator = () =>{
      let dateStart = Date.now();
      // 60 Hz
      // if (fcEmulator.clocks%3 === 0){
      //   runInterval = 5;
      // }
      // else{
      //   runInterval = 5;
      // }
      // clocks for 1 frame
      // let runclock = 341*262;
      // if((fcEmulator.ppu.isRendering())&& fcEmulator.ppu.oddFrame){
      //   runclock--;
      // }
      let frame2 = false;
      if(running)
      {
        while((!fcEmulator.ppu.frameDone) && running){
        // while (runclock--) {
          fcEmulator.clock();
          // if((fcEmulator.ppu.frameDone) && (!frame2)){
          //   frame2 = true;
          //   fcEmulator.ppu.frameDone = false;
          // }
        }
      }
      // else {
      //   while(runstep){
      //     if(fcEmulator.clocks !== 0 && fcEmulator.clocks%3 === 0 && fcEmulator.cpu.deferCycles === 0){
      //       runstep = false;
      //     }
      //     fcEmulator.clock();
      //   }
      // }
      fcEmulator.ppu.frameDone = false;
      fcEmulator.option.onFrame(fcEmulator.ppu.displayOutput);
      // draw debug information.
      // debugCatchDrawLog();
      // let controllerinput = new Uint8Array(2).fill(0);
      // controllerinput[0] = 0x01;
      // controllerinput[1] = fcEmulator.controller.ctrlState[controllerinput[0]-1];
      // displayControllerInput(controllerinput);
      // controllerinput[0] = 0x02;
      // controllerinput[1] = fcEmulator.controller.ctrlState[controllerinput[0]-1];
      // displayControllerInput(controllerinput);
      // debugCatchDrawPalette(fcEmulator.ppu.ColorTable, palettesIndex);
      // debugCatchDrawPatternTables(fcEmulator.ppu.ColorTable, 0x00, palettesIndex);
      // debugCatchDrawPatternTables(fcEmulator.ppu.ColorTable, 0x01, palettesIndex);
      // debugCatchOAMData(fcEmulator.ppu.regs.OAMDATA);
      // debugCatchDrawNameTables(fcEmulator.ppu.ColorTable, 0, 0, fcEmulator.ppu.tramAddr, fcEmulator.ppu.fineX);
      // debugCatchDrawNameTables(fcEmulator.ppu.ColorTable, 0, 1, fcEmulator.ppu.tramAddr, fcEmulator.ppu.fineX);
      // debugCatchDrawNameTables(fcEmulator.ppu.ColorTable, 1, 0, fcEmulator.ppu.tramAddr, fcEmulator.ppu.fineX);
      // debugCatchDrawNameTables(fcEmulator.ppu.ColorTable, 1, 1, fcEmulator.ppu.tramAddr, fcEmulator.ppu.fineX);

      let dateInfo: number[] = new Array(2);
      let dateEnd = Date.now();
      let dateDiff = dateEnd - dateStart;
      let framRate = 1000/(dateStart - dateLast);
      dateInfo[0] = dateDiff;
      dateLast = dateStart;
      dateInfo[1] = framRate;
      debugCatchTime(dateInfo);
    };
    if (!currentTimer) {
      currentTimer = setInterval(runEmulator, runInterval);
    }
  }));
}

// This method is called when your extension is deactivated
export function deactivate(context: vscode.ExtensionContext) {
  context.subscriptions.forEach((d) => d.dispose());
}

export function getCurrentPanel(){
  return currentPanel;
}
