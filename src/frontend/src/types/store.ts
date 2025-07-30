export interface Wallet {
  balance: number
  currency: string
}

export interface Transaction {
  id: string
  type: string
  amount: number
  currency: string
  status: string
  date: string
  description: string
  recipient?: string
}

export interface AccountSummary {
  totalIn: number
  totalOut: number
  interest: number
}

export interface DataSource {
  wallet: string | null
  transactions: string | null
}

export interface TransactionPagination {
  currentPage: number
  pageSize: number
  totalCount: number
  hasMore: boolean
  isLoadingMore: boolean
}

export interface BankingState {
  wallet: Wallet | null
  transactions: Transaction[]
  accountSummary: AccountSummary | null
  loading: boolean
  error: string | null
  dataSource: DataSource
  transactionPagination: TransactionPagination
  lastSyncTimestamp: number | null
  pendingTransactions: Set<string>
}

export interface WalletData {
  balance: number
  currency: string
  source: string
}

export interface TransactionData {
  transactions: Transaction[]
  source: string
}

