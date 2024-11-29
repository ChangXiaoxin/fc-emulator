// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import path from 'path';
import { FCEmulator } from './FC/FCEmulator';
import { IOptions } from "./Interface/Emulator";
import { drawImage } from './FC/display';

let currentPanel: vscode.WebviewPanel | undefined = undefined;
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('FC Emulator is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
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
		    enableScripts: true
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
		  }
		);
		  // Display a message box to the user
		vscode.window.showInformationMessage('Run FC Emulator from FC Emulator!');

		const fc_options: IOptions ={
		  sampleRate: 0,
		  onSample: (volume: number) => void{

		  },
		  onFrame: (frame: Uint8Array) => void{

		  }, // [r,g,b, r,g,b, ...] 256*240*3 = 184320 bytes;
		};
		const rom_path = path.join(context.extensionPath, 'src', 'test', 'nestest.nes');
		var fc_data = fs.readFileSync(rom_path);
		// Debug log
		const log_path = path.join(context.extensionPath, 'src', 'test', 'run.log');
        fs.writeFileSync(log_path, "");
		let fcEmulator = new FCEmulator(fc_data, fc_options, log_path);
		let image = new Uint8Array(4);
		image[0] = 0;
		image[1] = 255;
		image[2] = 255;
		image[3] = 255;
		drawImage(image);
		while(1)
		{
		  fcEmulator.clock();
		}
	}));
}

// This method is called when your extension is deactivated
export function deactivate() {}

export function getCurrentPanel(){
  return currentPanel;
}
