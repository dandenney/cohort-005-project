# A Refund is its own record, separate from the Refund Request

Approving a Refund Request creates a separate Refund record (one per Approved Refund Request) in the Pending state, holding the amount copied from the Purchase's `amountPaid`. We keep "the decision" (the Refund Request: Open, Approved, Declined) apart from "the money" (the Refund: Pending, Issued, Failed). That way a Failed Refund can exist while its Refund Request stays Approved, and a payment provider can later drive the Refund's state without touching the decision. `refund_requests.amountRefunded` is dropped in favour of `refunds.amount`, because a Refund is always the full amount paid.

## Considered Options

- **Treat approval as the Refund**, with the money handled outside the app: simplest, but it can't represent a Pending or Failed Refund, which the glossary already names.
- **Refund-status columns on `refund_requests`**: avoids a table, but mixes two lifecycles in one row and gets awkward once the money step can fail and be retried.

## Consequences

- There is no payment provider yet, so an Admin moves a Refund from Pending to Issued or Failed by hand on the refund approval screen. A provider webhook should replace that manual step, not add another path.
- The allowed moves are Pending → Issued, Pending → Failed, and Failed → Issued. Issued is final. A retry after a failure reuses the same Refund; it never creates a second one.
