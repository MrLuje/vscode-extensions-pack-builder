import * as vscode from "vscode";
import * as path from "path";
import { EXTENSION_FOLDER } from "../const";
import { Extension } from "../models";
import { log } from "../helpers/log";
import { ProcessPackCreation } from "../helpers/packFactory";
import { CheckUserFolder, AskMultiple, GetGitUserName, SanitizePackageId, SanitizePublisherId } from "../helpers";
import { getInstalledExtensions } from "../helpers/extensionList";

export async function CreatePack(context: vscode.ExtensionContext) {
  const { err, storagePath } = CheckUserFolder();
  if (err || !storagePath) {
    return;
  }

  let extensions$ = getInstalledExtensions(context);

  log.appendLine(`* Creating a new pack !`);
  log.appendLine(` - Storage path: ${storagePath}`);
  log.appendLine(` - Extensions Pack builder path: ${context.extensionPath}`);

  let packName$ = vscode.window.showInputBox({
    placeHolder: "What is the name of your pack ?"
  });

  let [packNameRaw, extensions] = await Promise.all([packName$, extensions$]);
  if (!packNameRaw) {
    return;
  }

  let packName = packNameRaw;
  let selectedExtensions: Extension[] = [];

  await AskMultiple(
    "Select the extensions you want to pack :",
    extensions
      .map(ext => {
        return {
          id: ext.id,
          label: ext.displayName
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
  publisher = SanitizePublisherId(publisher);
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
