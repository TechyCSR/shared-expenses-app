export interface User {
  id: string
  clerk_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Group {
  id: string
  name: string
  description: string | null
  default_currency: string
  created_by: string
  created_at: string
  updated_at: string
  member_count: number
  is_member?: boolean
  user_role?: string | null
}

export interface GroupMember {
  id: string
  user_id: string
  clerk_id: string | null
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string
  joined_at: string
  left_at: string | null
  is_active: boolean
}

export interface Expense {
  id: string
  group_id: string
  description: string
  amount: string
  currency: string
  expense_date: string
  split_type: string
  paid_by: string
  payer_name: string | null
  notes?: string | null
  created_by: string
  created_at: string
  updated_at: string
  participants?: ExpenseParticipant[]
}

export interface ExpenseParticipant {
  id: string
  user_id: string
  user_email: string
  user_name: string | null
  share_value: string | null
  amount_owed: string
}

export interface Settlement {
  id: string
  group_id: string
  from_user_id: string
  to_user_id: string
  amount: string
  currency: string
  settlement_date: string
  notes: string | null
  created_by: string
  created_at: string
}

export interface ImportJob {
  id: string
  group_id: string
  filename: string
  status: string
  total_rows: number
  imported_rows: number
  rejected_rows: number
  created_at: string
  completed_at: string | null
}

export interface ImportAnomaly {
  id: string
  import_job_id: string
  row_number: number
  anomaly_type: string
  severity: string
  message: string
  suggested_action: Record<string, unknown> | null
  raw_row_data: Record<string, string>
  user_decision: string | null
  user_resolution: Record<string, unknown> | null
  created_at: string
  resolved_at: string | null
}

export interface ImportReport {
  import_job_id: string
  report_data: {
    total_rows: number
    imported_rows: number
    rejected_rows: number
    modified_rows: number
    detected_anomalies: Record<string, number>
    actions_taken: Record<string, number>
    generated_at: string
  }
  generated_at: string
}

export interface BalanceSummary {
  user_id: string
  balance: string
  currency: string
  breakdown: {
    expenses_paid: BalanceItem[]
    expenses_owed: BalanceItem[]
    settlements_received: BalanceItem[]
    settlements_sent: BalanceItem[]
  }
}

export interface BalanceItem {
  type: string
  expense_id: string | null
  settlement_id?: string | null
  description: string
  amount: string
  currency: string
  date: string
  counterparty: string | null
  counterparty_name?: string | null
}

export interface DebtEntry {
  from_user_id: string
  from_name: string
  to_user_id: string
  to_name: string
  amount: number
  currency: string
}

export interface GroupBalances {
  balances: BalanceSummary[]
  member_names: Record<string, string>
  debts: DebtEntry[]
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: Record<string, unknown>
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}