# Only a Claimed Seat blocks approval; the Refund Window governs raising, not deciding

When an Admin decides a Refund Request, the only rule enforced again is the Claimed Seat rule, because the glossary makes it absolute: a Purchase with any Claimed Seat can no longer get a Refund. The other eligibility checks (the 14-day Refund Window and the watch-time limit) decide whether a learner may *raise* a Refund Request. On the approval screen they are shown as facts for the Admin to weigh, not as blocks.

This is deliberate. An Admin deciding on day 20 a request raised on day 10 is normal, and a learner who keeps watching while they wait shouldn't be locked out by a rule that only applies to raising a request. The Admin uses their judgement.

## Consequences

- The Claimed Seat check runs again inside the approval transaction, so a Seat claimed between the screen loading and the Admin clicking Approve still blocks the approval.
