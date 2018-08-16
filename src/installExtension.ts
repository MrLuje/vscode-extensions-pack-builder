import * as vscode from "vscode";
import { IsInsiders, Delay } from "./helper";

export async function InstallVSIX(file: vscode.Uri) {
  if (!file || !file.fsPath) {
    return;
  }

  const term = vscode.window.createTerminal("InstallVSIX");
  const command = IsInsiders() ? "code-insiders" : "code";

  await term.processId;
  await Delay(200);

  term.sendText(`${command} --install-extension ${file.fsPath}`, true);
  term.show(false);

  vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: "test" }, (progress, token) => {
    return new Promise((ok, nok) => {});
  });

  await vscode.window.showInformationMessage("Installing extension...");
}
