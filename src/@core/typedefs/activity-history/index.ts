import { ISalesPerson } from "../salesperson";

export type ActivityHistoryEvent =
  | "created"
  | "updated"
  | "checked_in"
  | "checked_out"
  | "draft_saved"
  | "submitted";

export interface ActivityHistoryUser {
  id: number;
  name: string;
  salesPerson?: ISalesPerson[];
}

export interface ActivityHistory {
  id: number;
  assignment_id: number;
  event: ActivityHistoryEvent;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  occurred_at: string;
  user: ActivityHistoryUser | null;
}

export interface ActivityHistoryResponse {
  response_code: number;
  message: string;
  data: ActivityHistory[];
}
