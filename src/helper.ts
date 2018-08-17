import * as vscode from "vscode";
import * as child_process from "child_process";
import * as sanitizefilename from "sanitize-filename";

export function IsInsiders() {
  return !!vscode.env.appName.match(/insiders/i);
}

export function SanitizePackageId(packageName: string) {
  const packageIdFirstCharRegex = /[^a-z0-9-~]/g;
  const packageIdRestRegex = /[^a-z0-9-._~]*/g;
  let str = sanitizefilename(packageName).toLocaleLowerCase();
  if (packageIdFirstCharRegex.test(str[0])) {
    str = str[0].replace(packageIdFirstCharRegex, "") + str.substring(1);
  }
  if (packageIdRestRegex.test(str.substring(1))) {
    str = str[0] + str.substring(1).replace(packageIdRestRegex, "");
  }
  return str;
}

export function Delay(timeoutMs: number = 1000) {
  return new Promise((ok, _) => {
    setTimeout(() => ok(), timeoutMs);
  });
}

export function GetUserFolder() {
  return (
    process.env.APPDATA || (process.platform === "darwin" ? process.env.HOME + "/Library/Preferences" : process.env.HOME + "/.local/share")
  );
}

export function GetGitUserName(): Promise<string> {
  return new Promise((resolve, reject) => {
    child_process.exec("git config --get user.name", (err, stdOut, stdErr) => {
      if (err) {
        reject(stdOut);
      } else {
        resolve(stdOut);
      }
    });
  });
}

export async function AskMultiple(
  question: string,
  picks: vscode.QuickPickItem[],
  save: (picks: vscode.QuickPickItem[]) => void
): Promise<boolean> {
  const pick = await vscode.window.showQuickPick(picks, {
    placeHolder: question,
    ignoreFocusOut: true,
    matchOnDescription: true,
    matchOnDetail: true,
    canPickMany: true
  });
  if (pick) {
    save(pick);
    return true;
  }
  return false;
}

export async function AskOneOfOrDefault(question: string, picks: vscode.QuickPickItem[], save: (pick: string) => void): Promise<boolean> {
  const pickOptions: vscode.QuickPickOptions = {
    placeHolder: question,
    ignoreFocusOut: true,
    matchOnDescription: true,
    matchOnDetail: true
  };

  // We already have item to propose
  if (picks && picks.length > 0) {
    const pick = await vscode.window.showQuickPick(picks, pickOptions);
    if (pick) {
      save(pick.label);
      return true;
    }
    return false;
  }

  // No item, free text
  const res = await vscode.window.showInputBox(pickOptions);
  if (res) {
    save(res);
    return true;
  }
  return false;
}
