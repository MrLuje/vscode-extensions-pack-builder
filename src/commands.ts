import { InstallVSIX } from "./installExtension";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { AskMultiple, GetGitUserName } from "./helper";
import * as sanitizefilename from "sanitize-filename";
import { prfs } from "./fs";
import { child_process } from "./child_process";

const EXTENSION_FOLDER = "vscode-project-extentions-templates";

interface extension {
  label: string;
  id: string;
}

interface packOptions {
  packname: string;
  packid: string;
  publisher: string;
  extensions: extension[];
}

export async function CreatePack(context: vscode.ExtensionContext) {
  const storagePath = context.storagePath;
  if (!storagePath) {
    vscode.window.showErrorMessage(`No storage path available to build extensions, please report an issue !`);
    return;
  }

  let packNameRaw = await vscode.window.showInputBox({ placeHolder: "What is the name of your pack ?" });
  if (!packNameRaw) {
    return;
  }
  let packName = packNameRaw;

  let selectedExtensions: extension[] = [];

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
    res => (selectedExtensions = <extension[]>res)
  );

  if (selectedExtensions.length === 0) {
    return;
  }

  let publisher = "";
  try {
    publisher = await GetGitUserName();
  } catch {
    let pub = await vscode.window.showInputBox({ prompt: `What\'s your publisher name ? (it will only be used as pack author)` });
    if (!pub) {
      return;
    }
    publisher = pub;
  }
  publisher = publisher.trim();

  vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: "Building extension pack..." },
    async (progress, token) => {
      progress.report({ message: "Creating extension factory...", increment: 50 });
      let extensionPath = path.join(path.dirname(storagePath), EXTENSION_FOLDER);

      const options = { packid: sanitizefilename(packName), packname: packName, publisher: publisher, extensions: selectedExtensions };

      if (token.isCancellationRequested) {
        return;
      }
      await EnsureExtensionPackFactory(context, extensionPath, options);

      if (token.isCancellationRequested) {
        return;
      }
      progress.report({ message: "Packaging the pack...", increment: 20 });
      await PackageExtension(extensionPath, options.packid);

      if (token.isCancellationRequested) {
        return;
      }
      progress.report({ message: "Installing the pack...", increment: 20 });
      InstallVSIX(vscode.Uri.file(path.join(extensionPath, options.packid, "build", `${options.packid}.vsix`)));

      progress.report({ message: "Done...", increment: 10 });
    }
  );
}

async function EnsureExtensionPackFactory(context: vscode.ExtensionContext, factoryFolder: string, options: packOptions) {
  if (!context.storagePath) {
    return false;
  }
  // sanitizefilename
  const extensionDisplayName = options.packname;
  const extensionTemplatePath = path.join(factoryFolder, options.packid);

  if (await !prfs.exists(factoryFolder)) {
    await prfs.mkdir(factoryFolder);
  }

  // install extension generator
  await child_process.exec("npm i yo generator-code", { cwd: factoryFolder });

  if (await !prfs.exists(path.join(extensionTemplatePath, "README.md"))) {
    // generate extension
    let cmd = `yo code --extensionName="${
      options.packid
    }" --extensionDescription="Template to build extension packs" --extensionType=extensionpack --extensionDisplayName="${extensionDisplayName}" --extensionPublisher="${
      options.publisher
    }" --extensionParam="n"`;
    await child_process.exec(cmd, { cwd: factoryFolder });
  }

  // update readme
  let rs = fs.createReadStream(path.join(context.extensionPath, "out", "extension_readme.md"));
  let ws = fs.createWriteStream(path.join(extensionTemplatePath, "README.md"));
  rs.pipe(ws);

  // update package.json
  rs = fs.createReadStream(path.join(context.extensionPath, "out", "extension_package.json"));
  ws = fs.createWriteStream(path.join(extensionTemplatePath, "package.json"));
  rs.pipe(ws);

  let file = await prfs.readFile(path.join(context.extensionPath, "out", "extension_package.json"), "UTF-8");
  file = file
    .replace("#extension-name#", options.packid)
    .replace("#extension-displayname#", options.packname)
    .replace("#extension-publisher#", options.publisher)
    .replace("#extension-list#", '"pwet pwe"');
  fs.writeFileSync(path.join(extensionTemplatePath, "package.json"), file, "UTF-8");

  if (await !prfs.exists(path.join(extensionTemplatePath, "build"))) {
    await prfs.mkdir(path.join(extensionTemplatePath, "build"));
  }

  return true;
}

async function PackageExtension(extensionPath: string, extensionName: string) {
  child_process.exec(`npx vsce package -o build/extension-template.vsix`, { cwd: path.join(extensionPath, extensionName) });
}
