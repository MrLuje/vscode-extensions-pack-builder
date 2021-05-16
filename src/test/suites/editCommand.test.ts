import * as assert from "assert";
import * as sinon from "sinon";
import * as packfactory from "../../helpers/packFactory";
import * as extensionList from "../../helpers/extensionList";
import * as helpers from "../../helpers";
import * as vscode from "vscode";
import { join } from "path";
import { preSelectAndFormatExtensionList, ExtensionPack } from "../../commands/editCommand";
import { getExtensions } from "../../helpers/extensionProvider";

suite("EditCommand ProcessPackCreation", function() {
  var processPackCreationStub: sinon.SinonStub;
  var quickPickStub: sinon.SinonStub;
  var askMultipleStub: sinon.SinonStub;
  var inputBoxStub: sinon.SinonStub;
  var getGitUserNameStub: sinon.SinonStub;
  var checkUserFolderStub: sinon.SinonStub;
  const expectedPackageName = "packname";
  const expectedGitUserName = "name";

  setup(() => {
    this.timeout("10s");

    processPackCreationStub = sinon.stub(packfactory, "ProcessPackCreation");
    quickPickStub = sinon.stub(vscode.window, "showQuickPick");
    askMultipleStub = sinon.stub(helpers, "AskMultiple");

    checkUserFolderStub = sinon.stub(helpers, "CheckUserFolder");
    checkUserFolderStub.callsFake(() => {
      return { err: false, storagePath: join(__dirname, "..", "workspaces", "expected") };
    });

    inputBoxStub = sinon.stub(vscode.window, "showInputBox");
    inputBoxStub.resolves(expectedPackageName);

    getGitUserNameStub = sinon.stub(helpers, "GetGitUserName");
    getGitUserNameStub.resolves(expectedGitUserName);
  });

  teardown(() => {
    processPackCreationStub.restore();
    getGitUserNameStub.restore();
    askMultipleStub.restore();
    inputBoxStub.restore();
    quickPickStub.restore();
  });

  test("Should correctly use existing pack to fill the quickPick", async function() {
    quickPickStub.callsFake(picks => undefined);

    await vscode.commands.executeCommand("packBuilder.editPack");

    assert.strictEqual(processPackCreationStub.calledOnce, false);
    sinon.assert.calledWithMatch(quickPickStub, [{ name: "p1", label: "P1", publisher: "myself", extensions: ["p2", "p3"] }]);
  });
});

suite("preSelectAndFormatExtensionList", function() {
  let getKnownExtensionsStub: sinon.SinonStub;
  setup(() => {
    getKnownExtensionsStub = sinon.stub(extensionList, "getKnownExtensions").callsFake(c => []);
  });

  teardown(() => {
    getKnownExtensionsStub.restore();
  });

  test("Should returns at least all extensions given", function() {
    const selectedPack = { name: "", label: "", extensions: [], publisher: "" };
    const installedExtensions = getExtensions()
      .filter(e => e.extensionPath.includes(".vscode"))
      .map(e => {
        return { ...e, displayName: e.id };
      });
    const extensionsReadyForPick = preSelectAndFormatExtensionList(<vscode.ExtensionContext>{}, installedExtensions, selectedPack);
    assert.strictEqual(installedExtensions.length, extensionsReadyForPick.length);
  });

  test("Should returns all extensions unpicked if no selectedPack", function() {
    const installedExtensions = getExtensions()
      .filter(e => e.extensionPath.includes(".vscode"))
      .map(e => {
        return { ...e, displayName: e.id };
      });
    const selectedPack: ExtensionPack = { name: "", label: "", extensions: [], publisher: "" };
    const extensionsReadyForPick = preSelectAndFormatExtensionList(<vscode.ExtensionContext>{}, installedExtensions, selectedPack);
    assert.strictEqual(extensionsReadyForPick.filter(e => e.picked).length, 0);
  });

  test("Should returns pick extensions from selectedPack", function() {
    const installedExtensions = getExtensions()
      .filter(e => e.extensionPath.includes(".vscode"))
      .map(e => {
        return { ...e, displayName: e.id };
      });
    const selectedPack: ExtensionPack = { name: "", label: "", extensions: [installedExtensions[0].id], publisher: "" };
    const extensionsReadyForPick = preSelectAndFormatExtensionList(<vscode.ExtensionContext>{}, installedExtensions, selectedPack);
    assert.strictEqual(extensionsReadyForPick.filter(e => e.picked).length, 1);
    assert.strictEqual(extensionsReadyForPick.filter(e => e.picked)[0].id, installedExtensions[0].id);
  });

  test("Should add label from unknown extensions using getKnownExtensions", function() {
    getKnownExtensionsStub.returns([{ id: "vscode-poney", displayName: "Who doesn't love poney..." }]);
    const installedExtensions = getExtensions()
      .filter(e => e.extensionPath.includes(".vscode"))
      .map(e => {
        return { ...e, displayName: e.id };
      });
    const selectedPack: ExtensionPack = {
      name: "",
      label: "",
      extensions: ["vscode-poney"],
      publisher: ""
    };

    const extensionsReadyForPick = preSelectAndFormatExtensionList(<vscode.ExtensionContext>{}, installedExtensions, selectedPack);

    assert.strictEqual(extensionsReadyForPick.filter(e => e.id === "vscode-poney")[0].label, "Who doesn't love poney...");
  });

  test("Should not do anything for unmatched extensions", function() {
    getKnownExtensionsStub.returns([{ id: "vscode-poney", displayName: "Who doesn't love poney..." }]);
    const installedExtensions = getExtensions()
      .filter(e => e.extensionPath.includes(".vscode"))
      .map(e => {
        return { ...e, displayName: e.id };
      });
    const selectedPack: ExtensionPack = { name: "", label: "", extensions: [], publisher: "" };

    const extensionsReadyForPick = preSelectAndFormatExtensionList(<vscode.ExtensionContext>{}, installedExtensions, selectedPack);

    assert.strictEqual(extensionsReadyForPick.filter(e => e.label === "Who doesn't love poney...").length, 0);
  });
});
