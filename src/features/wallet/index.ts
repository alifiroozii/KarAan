export {
  WalletLedgerService,
  type WalletCreditResult,
  type WalletSummary,
  type WalletTransactionView,
} from "@/modules/wallet/wallet-ledger.service";

export interface WalletBalance {
  availableRials: bigint;
  lockedEscrowRials: bigint;
}
