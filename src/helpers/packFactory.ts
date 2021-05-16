import * as vscode from "vscode";
import { prfs } from "../node_async/fs";
import * as path from "path";
import * as os from "os";
import { child_process } from "../node_async/child_process";
import { log } from "./log";
import { PackOptions } from "../models";
import { InstallVSIX } from "./installExtension";

export async function EnsureExtensionPackFactory(options: PackOptions) {
  const extensionDisplayName = options.packageName;
  const extensionTemplatePath = path.join(options.factoryFolder, options.packageId);

  if (!(await prfs.exists(options.factoryFolder))) {
    await prfs.mkdir(options.factoryFolder);
  }

  // install extension generator
  if (!(await prfs.exists(path.join(options.factoryFolder, "node_modules")))) {
    log.appendLine(`  - Installing generators...`);
    await child_process.exec("npm i yo https://github.com/mrluje/vscode-generator-code.git#fix", { cwd: options.factoryFolder });
  }

  if (!(await prfs.exists(path.join(extensionTemplatePath, "README.md")))) {
    // generate extension
    let cmd = `node_modules${path.sep}.bin${path.sep}yo code --extensionName="${options.packageId
      }" --extensionDescription="Template to build extension packs" --extensionType=extensionpack --extensionDisplayName="${extensionDisplayName}" --extensionPublisher="${options.publisher
      }" --extensionParam="n"`;

    try {
      log.appendLine(`  - Generating the template...`);
      await child_process.exec(cmd, { cwd: options.factoryFolder });
    } catch (err) {
      log.appendLine(err);
      vscode.window.showErrorMessage("Failed to initialize the template...", { title: "Show logs" }).then(maybeShowLogPanel);
      return false;
    }
  }

  try {
    log.appendLine(`  - Copying icon...`);
    await prfs.copyFile(path.join(options.extensionPath, "out", "pack_icon.png"), path.join(extensionTemplatePath, "pack_icon.png"), undefined);
  } catch (err) {
    log.appendLine(err);
    vscode.window.showErrorMessage("Failed to copy default icon...", { title: "Show logs" }).then(maybeShowLogPanel);
    return false;
  }

  log.appendLine(`  - Updating readme.md...`);

  try {
    let rd = await prfs.readFile(path.join(options.extensionPath, "out", "extension_readme.md"), "UTF-8");
    rd = rd
      .replace("%packageName%", options.packageName)
      .replace(
        "%extension-list%",
        options.extensions.map(ext => `${ext.label} (${ext.id})`).reduce((prev, cur, i) => (prev += `- ${cur}${os.EOL}`), "")
      );
    await prfs.writeFile(path.join(extensionTemplatePath, "README.md"), rd, "UTF-8");
  } catch (err) {
    log.appendLine(err);
    vscode.window.showErrorMessage("Failed to update README.md file...", { title: "Show logs" }).then(maybeShowLogPanel);
    return false;
  }

  log.appendLine(`  - Updating package.json...`);

  let pkJson = await prfs.readFile(path.join(options.extensionPath, "out", "extension_package.json"), "UTF-8");
  pkJson = pkJson
    .replace("#extension-name#", options.packageId.replace(".", ""))
    .replace("#extension-displayname#", options.packageName)
    .replace("#extension-publisher#", options.publisher)
    .replace("#extension-list#", `${options.extensions.map(ext => `"${ext.id}"`).join(",")}`);

  let packageJson = JSON.parse(pkJson);
  packageJson.repository = extensionTemplatePath;
  packageJson.icon = "pack_icon.png";

  await prfs.writeFile(path.join(extensionTemplatePath, "package.json"), JSON.stringify(packageJson), "UTF-8");

  log.appendLine(`  - Preparing build folder...`);
  if (!(await prfs.exists(path.join(extensionTemplatePath, "build")))) {
    await prfs.mkdir(path.join(extensionTemplatePath, "build"));
  }

  return true;
}

function maybeShowLogPanel(value: { title: string; } | undefined) {
  if (!value)
    return;
  const { title } = value;
  if (title === "Show logs") {
    log.show();
  }
}

export function PackageExtension(extensionPath: string, extensionName: string) {
  return child_process.exec(`npx vsce package -o build/${extensionName}.vsix`, { cwd: extensionPath });
}

export function ProcessPackCreation(options: PackOptions) {
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
        log.appendLine(err);
        vscode.window.showErrorMessage("Failed to generate the pack...", { title: "Show logs" }).then(maybeShowLogPanel);
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
        log.appendLine(err);
        vscode.window.showErrorMessage("Failed to install the pack...", { title: "Show logs" }).then(maybeShowLogPanel);
        return;
      }
      log.appendLine(` Done`);
    }
  );
}

async function DeleteNodeModules(factoryFolder: string) {
  const nodeModulesPath = path.join(factoryFolder, "node_modules");
  if (await prfs.exists(nodeModulesPath)) {
    log.appendLine(`  - Deleting node_modules...`);
    try {
      await prfs.rimraf(nodeModulesPath);
    } catch (err) {
      log.appendLine(err);
      vscode.window.showErrorMessage("Failed to delete node_modules folder...", { title: "Show logs" }).then(maybeShowLogPanel);
      return false;
    }
  }
  return true;
}

async function DeleteFile(factoryFolder: string, fileName: string) {
  const packageLockPath = path.join(factoryFolder, fileName);
  if (await prfs.exists(packageLockPath)) {
    log.appendLine(`  - Deleting ${fileName}...`);
    try {
      await prfs.unlink(packageLockPath);
    } catch (err) {
      log.appendLine(err);
      vscode.window.showErrorMessage(`Failed to delete ${fileName} file...`, { title: "Show logs" }).then(maybeShowLogPanel);
      return false;
    }
  }
}

export async function ResetExtensionPackFactory(factoryFolder: string) {
  await DeleteNodeModules(factoryFolder);
  await DeleteFile(factoryFolder, "package-lock.json");
}
