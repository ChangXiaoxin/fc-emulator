// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import { FC_Emulator } from './FC/fc_emulator';
import { IOptions } from "./Interface/Emulator";
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "fc-simulator" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('fc-simulator.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from FC Simulator!');

		const fc_options: IOptions ={
		  sampleRate: 0,
		  onSample: (volume: number) => void{

		  },
		  onFrame: (frame: Uint8Array) => void{

		  }, // [r,g,b, r,g,b, ...] 256*240*3 = 184320 bytes;
		};
		const path = 'C:/Users/Chang/Documents/Code/fc-simulator/src/FC/nestest.nes';
		let fc_emulator:FC_Emulator;
        
		var fc_data = fs.readFileSync(path);
		fc_emulator = new FC_Emulator(fc_data, fc_options);
		while(1)
		{
		  fc_emulator.clock();
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
