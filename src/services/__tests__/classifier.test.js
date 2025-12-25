import { describe, it, expect } from "@jest/globals";
import { classifyTask } from "../classifier.js";

describe("classifyTask", () => {
  // Test 1: Category classification - scheduling
  it("should classify task as 'scheduling' when description contains 'meeting'", () => {
    const result = classifyTask("Schedule a meeting with the team tomorrow");
    expect(result.category).toBe("scheduling");
    expect(result.priority).toBeDefined();
  });

  // Test 2: Category classification - finance
  it("should classify task as 'finance' when description contains 'budget'", () => {
    const result = classifyTask("Review the budget for next quarter");
    expect(result.category).toBe("finance");
  });

  // Test 3: Category classification - technical
  it("should classify task as 'technical' when description contains 'bug'", () => {
    const result = classifyTask("Fix the bug in the login system");
    expect(result.category).toBe("technical");
  });
});

