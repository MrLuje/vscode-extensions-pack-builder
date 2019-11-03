import * as assert from "assert";
import * as sinon from "sinon";
import * as packfactory from "../../helpers/packFactory";
import * as helpers from "../../helpers";
import { FnSelectExtensions } from "../../helpers";
import * as vscode from "vscode";

suite("AddCommand ProcessPackCreation", function() {
  var processPackCreationStub: sinon.SinonStub;
  var quickPickStub: sinon.SinonStub;
  var inputBoxStub: sinon.SinonStub;
  var getGitUserNameStub: sinon.SinonStub;
  let firstExtension: string;
  const expectedPackageName = "packname";
  const expectedGitUserName = "name";

  setup(() => {
    processPackCreationStub = sinon.stub(packfactory, "ProcessPackCreation");
    quickPickStub = sinon.stub(helpers, "AskMultiple");

    quickPickStub.callsFake((title, exts, saveFn: FnSelectExtensions) => {
      firstExtension = exts[0];
      saveFn([exts[0]]);
    });

    inputBoxStub = sinon.stub(vscode.window, "showInputBox");
    inputBoxStub.resolves(expectedPackageName);

    getGitUserNameStub = sinon.stub(helpers, "GetGitUserName");
    getGitUserNameStub.resolves(expectedGitUserName);
  });

  teardown(() => {
    processPackCreationStub.restore();
    getGitUserNameStub.restore();
    inputBoxStub.restore();
    quickPickStub.restore();
  });

  test("Pick first extension should call ProcessPackCreation", async function() {
    this.timeout("10s");
    await vscode.commands.executeCommand("packBuilder.createPack");

    assert.equal(processPackCreationStub.calledOnce, true);
    sinon.assert.calledWithMatch(processPackCreationStub, { extensions: [firstExtension] });
  });

  test("No pack name should quit procedure", async function() {
    this.timeout("10s");
    inputBoxStub.resolves("");

    await vscode.commands.executeCommand("packBuilder.createPack");
    assert.equal(processPackCreationStub.called, false);
  });

  test("No extensions selected should quit the procedure", async function() {
    this.timeout("10s");
    quickPickStub.callsFake((title, exts, saveFn: FnSelectExtensions) => {
      saveFn([]);
    });

    await vscode.commands.executeCommand("packBuilder.createPack");
    assert.equal(processPackCreationStub.called, false);
  });

  test("Should use git username if available", async function() {
    this.timeout("10s");
    await vscode.commands.executeCommand("packBuilder.createPack");

    assert.ok(processPackCreationStub.calledOnce);
    sinon.assert.calledWithMatch(processPackCreationStub, { publisher: expectedGitUserName });
  });

  test("Should use input package name", async function() {
    this.timeout("10s");
    await vscode.commands.executeCommand("packBuilder.createPack");

    assert.ok(processPackCreationStub.calledOnce);
    sinon.assert.calledWithMatch(processPackCreationStub, { packageName: expectedPackageName });
  });
});
