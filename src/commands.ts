import { InstallVSIX } from "./installExtension";
import * as vscode from "vscode";
import * as path from "path";
import { AskMultiple, GetGitUserName, GetUserFolder, SanitizePackageId } from "./helper";
import { EnsureExtensionPackFactory, PackageExtension } from "./packFactory";
import { log } from "./log";

const EXTENSION_FOLDER = "vscode-extensions-pack-builder";

export interface Extension {
  label: string;
  id: string;
}

export interface PackOptions {
  factoryFolder: string;
  extensionPath: string;
  packageName: string;
  packageId: string;
  publisher: string;
  extensions: Extension[];
}

export async function CreatePack(context: vscode.ExtensionContext) {
  const storagePath = GetUserFolder();
  if (!storagePath) {
    vscode.window.showErrorMessage(`No storage path available to build extensions, please report an issue !`);
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

  ProcessPackCreation(context, options);
}

function ProcessPackCreation(context: vscode.ExtensionContext, options: PackOptions) {
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Building extension pack... (first run may take a few minutes)",
      cancellable: true
    },
    async (progress, token) => {
      if (token.isCancellationRequested) {
        return;
      }
      log.appendLine(` Preparing extensions factory...`);
      let success = await EnsureExtensionPackFactory(options);
      if (!success || token.isCancellationRequested) {
        return;
      }

      log.appendLine(` Creating the extension...`);
      let packSuccess;
      try {
        packSuccess = await PackageExtension(path.join(options.factoryFolder, options.packageId), options.packageId);
      } catch (err) {
        vscode.window.showErrorMessage("Failed to generate the pack...\n" + err);
      }
      if (!packSuccess || token.isCancellationRequested) {
        return;
      }

      // set it as done so the progress window is done
      progress.report({ increment: 100 });
      log.appendLine(` Installing the extension...`);

      try {
        await InstallVSIX(vscode.Uri.file(path.join(options.factoryFolder, options.packageId, "build", `${options.packageId}.vsix`)));
      } catch (err) {
        vscode.window.showErrorMessage("Failed to install the pack...\n" + err);
      }
      log.appendLine(` Done`);
    }
  );
}
