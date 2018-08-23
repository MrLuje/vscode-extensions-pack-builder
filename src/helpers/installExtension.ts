import * as vscode from "vscode";
import { IsInsiders, Delay } from "./index";

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

  const option = await vscode.window.showInformationMessage("Installing extension... Once done, a restart is needed.", {
    title: "Reload now"
  });

  if (!option || option.title !== "Reload now") {
    return;
  }

  vscode.commands.executeCommand("workbench.action.reloadWindow");
}
