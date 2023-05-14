import ActionType from "../types/ActionType";
import ResourceType from "../types/ResourceType";

interface Permission {
    action: ActionType;
    id?: number;
    resource: ResourceType;
}

export default Permission;
  