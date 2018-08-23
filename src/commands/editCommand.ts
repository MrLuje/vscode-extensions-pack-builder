import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { EXTENSION_FOLDER } from "../const";
import { Extension } from "../models";
import { log } from "../helpers/log";
import { ProcessPackCreation } from "../helpers/packFactory";
import { CheckUserFolder, AskMultiple } from "../helpers";

export async function EditPack(context: vscode.ExtensionContext) {
  const { err, storagePath } = CheckUserFolder();
  if (err || !storagePath) {
    return;
  }

  const factoryFolder = path.join(storagePath, EXTENSION_FOLDER);
  if (!fs.existsSync(factoryFolder)) {
    vscode.window.showErrorMessage(`You didn't create any pack yet :(`);
    return;
  }

  const toNormalizedItem = (f: string) => {
    const fullpath = path.join(factoryFolder, f);
    return { name: f, fullpath: fullpath, isDir: fs.lstatSync(fullpath).isDirectory() };
  };

  const readAndSearchPackageJson = (fullpath: string) => {
    return { path: fullpath, content: fs.readdirSync(fullpath).filter(ff => ff === "package.json") };
  };

  const parseJson = (fullpath: string) => JSON.parse(fs.readFileSync(fullpath, { encoding: "UTF-8" }));

  const packageJsons = fs
    .readdirSync(factoryFolder)
    .filter(f => f !== "node_modules")
    .map(toNormalizedItem)
    .filter(f => f.isDir)
    .map(f => f.fullpath)
    .map(readAndSearchPackageJson)
    .filter(f => f.content.length > 0)
    .map(f => path.join(f.path, f.content[0]))
    .reduce((prev: string[], curr) => prev.concat(curr), [])
    .map(parseJson);

  const selectedExtension = await vscode.window.showQuickPick(
    packageJsons.map(pj => {
      return {
        label: pj.displayName as string,
        name: pj.name as string,
        extensions: pj.extensionPack as string[],
        publisher: pj.publisher as string
      };
    })
  );

  if (!selectedExtension) {
    return;
  }

  let allExtensions = vscode.extensions.all
    .filter(ext => ext.extensionPath.includes(".vscode"))
    .map(ext => {
      return {
        id: ext.id,
        label: ext.packageJSON.displayName || ext.packageJSON.name,
        picked: false
      };
    })
    .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label));

  // preselect extensions from the pack
  allExtensions = allExtensions.map(e => {
    e.picked = selectedExtension.extensions.indexOf(e.id) > -1;
    return e;
  });

  let selectedExtensions: Extension[] = [];

  await AskMultiple("Select the extensions you want to pack :", allExtensions, res => (selectedExtensions = <Extension[]>res));

  if (selectedExtensions.length === 0) {
    return;
  }

  const options = {
    packageId: selectedExtension.name,
    packageName: selectedExtension.label,
    publisher: selectedExtension.publisher,
    extensions: selectedExtensions,
    factoryFolder: path.join(storagePath, EXTENSION_FOLDER),
    extensionPath: context.extensionPath
  };

  log.appendLine(`* Editing a pack !`);
  log.appendLine(` - Storage path: ${storagePath}`);
  log.appendLine(` - Extensions Pack builder path: ${context.extensionPath}`);
  log.appendLine(` - Extension path: ${path.join(options.factoryFolder, options.packageId)}`);

  ProcessPackCreation(options);
}
