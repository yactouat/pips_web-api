import PendingUserModificationType from "../types/PendingUserModificationType";

interface PendingUserModification {
    committed_at?: string;
    created_at: string;
    id: number;
    field: PendingUserModificationType;
    value: string;
}

export default PendingUserModification;