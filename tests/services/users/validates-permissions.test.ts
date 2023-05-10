import validatesPermissions from "../../../src/services/users/validates-permissions";

describe("validatesPermissions", () => {
  test("should return false if permissions array does not contain only strings", () => {
    const actual = validatesPermissions([
      "Read:Blog_Posts_Drafts",
      "Update:Blog_Posts",
      1,
      "Delete:Users_Permissions",
      false,
    ]);
    expect(actual).toBe(false);
  });

  test("should return false if permissions array contains invalid action", () => {
    const actual = validatesPermissions([
      "Read:Blog_Posts_Drafts",
      "Update:Blog_Posts",
      "Delete:Users_Permissions",
      "Invalid_Action:Blog_Posts",
    ]);
    expect(actual).toBe(false);
  });

  test("should return false if permissions array contains invalid resource", () => {
    const actual = validatesPermissions([
      "Read:Blog_Posts_Drafts",
      "Update:Blog_Posts",
      "Delete:Users_Permissions",
      "Update:Invalid_Resource",
    ]);
    expect(actual).toBe(false);
  });

  test("should return true if permissions array contains valid permissions", () => {
    const actual = validatesPermissions([
      "Read:Blog_Posts_Drafts",
      "Update:Blog_Posts",
      "Delete:Users_Permissions",
    ]);
    expect(actual).toBe(true);
  });
});
