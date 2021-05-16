import * as assert from "assert";
import { SanitizePackageId } from "../../helpers";

suite("SanitizePackageId Tests", function() {
  test("Empty string returns empty", function() {
    assert.strictEqual(SanitizePackageId(""), "");
  });

  test("Should lowercase", function() {
    assert.strictEqual(SanitizePackageId("blabla"), "blabla");
    assert.strictEqual(SanitizePackageId("BLABLA"), "blabla");
  });

  test("Shouldnt start with some chars", function() {
    assert.strictEqual(SanitizePackageId("_blabla"), "blabla");
  });

  test("Shouldnt contains with some chars", function() {
    assert.strictEqual(SanitizePackageId("*bla*bla"), "blabla");
  });
});
