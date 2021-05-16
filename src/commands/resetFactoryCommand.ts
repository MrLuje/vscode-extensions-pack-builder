import * as vscode from "vscode";
import * as path from "path";
import { EXTENSION_FOLDER } from "../const";
import { CheckUserFolder } from "../helpers";
import { ResetExtensionPackFactory } from "../helpers/packFactory";

export async function ResetFactory(context: vscode.ExtensionContext) {
  const { err, storagePath } = CheckUserFolder();
  if (err || !storagePath) {
    return;
  }

  const factoryFolder = path.join(storagePath, EXTENSION_FOLDER);
  await ResetExtensionPackFactory(factoryFolder);

  vscode.window.showInformationMessage(`The factory folder is now empty, you can now safely create a new pack !`);
}
