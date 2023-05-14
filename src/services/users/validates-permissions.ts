import ActionType from "../../types/ActionType";
import ResourceType from "../../types/ResourceType";

const validateAction = (action: string): action is ActionType => {
  return [
    "Create",
    "Delete",
    "Delete_Own",
    "Read",
    "Read_Own",
    "Update",
    "Update_Own",
  ].includes(action);
};

const validateResource = (resource: string): resource is ResourceType => {
  return ["Blog_Posts", "Blog_Posts_Drafts", "Users_Permissions"].includes(
    resource
  );
};

const validatesPermissions = (permissions: any[]): boolean => {
  let permissionsAreValid = true;
  for (let i = 0; i < permissions.length; i++) {
    if (typeof permissions[i] !== "string") {
      permissionsAreValid = false;
      break;
    }
    const parsedPermission = (permissions[i] as string).split(":");
    permissionsAreValid =
      parsedPermission.length === 2 &&
      validateAction(parsedPermission[0]) &&
      validateResource(parsedPermission[1]);
    if (!permissionsAreValid) {
      break;
    }
  }
  return permissionsAreValid;
};

export default validatesPermissions;
