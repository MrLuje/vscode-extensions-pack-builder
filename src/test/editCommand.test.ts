import * as assert from "assert";
import * as sinon from "sinon";
import * as packfactory from "../helpers/packFactory";
import * as helpers from "../helpers";
import * as vscode from "vscode";
import { join } from "path";

suite("EditCommand ProcessPackCreation", function() {
  var processPackCreationStub: sinon.SinonStub;
  var quickPickStub: sinon.SinonStub;
  var askMultipleStub: sinon.SinonStub;
  var inputBoxStub: sinon.SinonStub;
  var getGitUserNameStub: sinon.SinonStub;
  const expectedPackageName = "packname";
  const expectedGitUserName = "name";

  setup(() => {
    this.timeout("10s");

    processPackCreationStub = sinon.stub(packfactory, "ProcessPackCreation");
    quickPickStub = sinon.stub(vscode.window, "showQuickPick");
    askMultipleStub = sinon.stub(helpers, "AskMultiple");
    sinon.stub(helpers, "CheckUserFolder").callsFake(() => {
      return { err: false, storagePath: join(__dirname, "workspaces", "expected") };
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

    assert.equal(processPackCreationStub.calledOnce, false);
    sinon.assert.calledWithMatch(quickPickStub, [{ name: "p1", label: "P1", publisher: "myself", extensions: ["p2", "p3"] }]);
  });
});
