export interface Assignee {
  id: string;
  name: string;
  avatarUrl: string;
  role?: string;
  department?: string;
  metadata?: Record<string, any>;
}

export interface AssigneeGroup {
  id: string;
  name: string;
  description?: string;
  assigneeIds: string[];
  color?: string;
  createdAt: number;
}

export interface AssigneeState {
  assignees: Assignee[];
  selectedAssigneeIds: string[];
  groups: AssigneeGroup[];
  currentGroupId: string | null;
  lastScanTime: number | null;
}

export const initialState: AssigneeState = {
  assignees: [],
  selectedAssigneeIds: [],
  groups: [],
  currentGroupId: null,
  lastScanTime: null
};
