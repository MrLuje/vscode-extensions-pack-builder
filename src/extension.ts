"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { AskOneOfOrDefault } from "./helper";
import { CreatePack } from "./commands";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-project-extentions-templates" is now active!');

  let disposableCreatePack = vscode.commands.registerCommand("extension.createPack", async () => CreatePack(context));

  let disposableApply = vscode.commands.registerCommand("extension.applyList", async () => {
    let list = context.globalState.get<string[]>("templateList", []);

    const templatesPicks = list.map(template => ({
      label: template
    }));
    let selectedTemplate = "";
    await AskOneOfOrDefault("Select you extensions template to apply", templatesPicks, template => (selectedTemplate = template));

    if (!selectedTemplate) {
      return;
    }

    let extensionsToEnable = context.globalState.get<string[]>(`template-${selectedTemplate}`, []);

    if (!(extensionsToEnable instanceof Array)) {
      vscode.window.showErrorMessage("Can't apply this group, data is in bad state =(");
      return;
    }

    //   let enablingExtensions = [];

    extensionsToEnable.forEach(async extension => {
      let installedExtension = vscode.extensions.getExtension(extension);
      if (installedExtension && !installedExtension.isActive) {
        await installedExtension.activate();
      }
    });
  });

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposableList = vscode.commands.registerCommand("extension.exportList", async () => {
    // The code you place here will be executed every time your command is executed

    let exts = vscode.extensions.all;
    let ctx = context;

    let enabledExtensions = exts.filter(e => e.isActive).map(e => e.id);

    let state = ctx.globalState;

    let list = state.get<string[]>("templateList", []);

    const templatesPicks = list.map(template => ({
      label: template
    }));
    let selectedTemplate = "";
    await AskOneOfOrDefault(
      "Give a name to your template (like: Angular extensions)",
      templatesPicks,
      template => (selectedTemplate = template)
    );

    if (!list.find(ext => ext === selectedTemplate)) {
      state.update("templateList", [...list, selectedTemplate]);
    }

    //CHECK IF ALREADY EXISTS, IF YES PROPOSE TO OVERWRITE
    state.update(`template-${selectedTemplate}`, enabledExtensions);

    // Display a message box to the user
    vscode.window.showInformationMessage("Done !");
  });

  context.subscriptions.push(disposableList, disposableApply, disposableCreatePack);
}

// this method is called when your extension is deactivated
export function deactivate() {}
