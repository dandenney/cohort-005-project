# Course access ends when a Refund Request is approved, not when the money is sent

Approving a Refund Request removes the learner's enrollment in the same transaction that creates the Pending Refund. For a team Purchase, it also cancels every Seat, so their claim links stop working. We chose approval over the moment the Refund becomes Issued so that a slow or Failed Refund doesn't let the learner keep watching a course they are being paid back for. A Failed Refund does not restore access: the decision stands, only the money is outstanding.

## Considered Options

- **End access when the Refund is Issued**: better for the learner, but the gap can be long and is open-ended while Refunds are marked by hand.
- **Never end access**: rejected. It makes a Refund a free course.
