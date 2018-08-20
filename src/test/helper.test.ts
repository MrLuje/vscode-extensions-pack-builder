import * as assert from "assert";
import { SanitizePackageId } from "../helper";

suite("SanitizePackageId Tests", function() {
  test("Empty string returns empty", function() {
    assert.equal(SanitizePackageId(""), "");
  });

  test("Should lowercase", function() {
    assert.equal(SanitizePackageId("blabla"), "blabla");
    assert.equal(SanitizePackageId("BLABLA"), "blabla");
  });

  test("Shouldnt start with some chars", function() {
    assert.equal(SanitizePackageId("_blabla"), "blabla");
  });

  test("Shouldnt contains with some chars", function() {
    assert.equal(SanitizePackageId("*bla*bla"), "blabla");
  });
});
