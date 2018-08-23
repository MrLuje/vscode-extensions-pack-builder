import * as vscode from "vscode";
import * as path from "path";
import { EXTENSION_FOLDER } from "../const";
import { Extension } from "../models";
import { log } from "../helpers/log";
import { ProcessPackCreation } from "../helpers/packFactory";
import { CheckUserFolder, AskMultiple, GetGitUserName, SanitizePackageId } from "../helpers";

export async function CreatePack(context: vscode.ExtensionContext) {
  const { err, storagePath } = CheckUserFolder();
  if (err || !storagePath) {
    return;
  }

  log.appendLine(`* Creating a new pack !`);
  log.appendLine(` - Storage path: ${storagePath}`);
  log.appendLine(` - Extensions Pack builder path: ${context.extensionPath}`);

  let packNameRaw = await vscode.window.showInputBox({
    placeHolder: "What is the name of your pack ?"
  });
  if (!packNameRaw) {
    return;
  }
  // if (!packageNameRegex.test(packNameRaw)) {
  //   let res = await vscode.window.showErrorMessage(`Invalid package name, only letters & numbers are allowed.`, { title: "Try again !" });
  //   if (!res || res.title !== "Try again !") {
  //     return;
  //   }
  //   await vscode.commands.executeCommand("packBuilder.createPack");
  //   return;
  // }
  let packName = packNameRaw;

  let selectedExtensions: Extension[] = [];

  await AskMultiple(
    "Select the extensions you want to pack :",
    vscode.extensions.all
      .filter(ext => ext.extensionPath.includes(".vscode"))
      .map(ext => {
        return {
          id: ext.id,
          label: ext.packageJSON.displayName || ext.packageJSON.name
        };
      })
      .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label)),
    res => (selectedExtensions = <Extension[]>res)
  );

  if (selectedExtensions.length === 0) {
    return;
  }

  let publisher = "";
  try {
    publisher = await GetGitUserName();
  } catch (err) {
    log.appendLine(` - Can't get git user.name - ${err}`);
    let pub = await vscode.window.showInputBox({ prompt: `What\'s your publisher name ? (it will only be used as pack author)` });
    if (!pub) {
      return;
    }
    publisher = pub;
  }
  publisher = publisher.trim();
  const options = {
    packageId: SanitizePackageId(packName),
    packageName: packName,
    publisher: publisher,
    extensions: selectedExtensions,
    factoryFolder: path.join(storagePath, EXTENSION_FOLDER),
    extensionPath: context.extensionPath
  };

  log.appendLine(` - New extension path: ${path.join(options.factoryFolder, options.packageId)}`);

  ProcessPackCreation(options);
}
