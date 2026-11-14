# Hosted in-app notification vendors for Cadence

Research for [#8](https://github.com/dandenney/cohort-005-project/issues/8), part of map [#7](https://github.com/dandenney/cohort-005-project/issues/7). This is a **comparison, not a pick**. The choice happens in a later grilling ticket.

Context: Cadence is a React Router v7 app on a Node server with SQLite via Drizzle. Recipients are **Students** only. The channel is in-app (bell/inbox) only for now, with email possibly later.

Researched 2026-11-14 from vendor docs, pricing pages and the npm registry. Pricing pages change often, so recheck them before committing to a vendor.

## Summary table

| | Knock | Novu Cloud | Courier | MagicBell | SuprSend |
|---|---|---|---|---|---|
| React package | `@knocklabs/react` 0.15.1 | `@novu/react` 3.19.2 | `@trycourier/courier-react` 9.3.5 | `@magicbell/react` 1.14.0 | `@suprsend/react` 1.5.0 |
| Prebuilt bell/inbox | Bell button, popover, full-page feed | `<Inbox />` built from Bell, Notifications and Preferences parts | Inbox, popup menu, toast, preferences | `FloatingInbox`, `Inbox` | Drop-in inbox, plus a headless option |
| Customisation | CSS vars, `renderItem`, dark mode, hooks | Override styles, replace any element or icon, hooks or `@novu/js` | Theme objects, custom views, `useCourier()` hooks | "Customizable rendering", plus headless hooks (`@magicbell/react-headless`) | Drop-in options or headless |
| Prebuilt preferences UI | Yes (React guide, plus a hosted page) | Yes, inside `<Inbox />` | Yes (`CourierPreferences`) | Concept only; no named React component found | Built with SDK hooks; also an embedded preference centre |
| Node SDK | `@knocklabs/node` 1.41.1 | `@novu/api` 3.19.1 | `@trycourier/courier` 10.0.0 | `magicbell-js` 1.8.0 | `@suprsend/node-sdk` 1.15.1 |
| Delay | Fixed, dynamic, until timestamp, time window; max 365 days | Fixed, scheduled, dynamic; max 1 / 7 / 30 days (Free / Pro / Team) | Relative or absolute; max 90 days per node | `wait` (seconds), `pause` / `abort` | Fixed, dynamic, relative; "Wait Until" a condition or event |
| Digest / batch | Yes, all plans | Yes; window max 1 / 7 / 30 days by plan | `batch`, `add-to-digest` | Not mentioned | Business plan and up |
| Cancel a pending run | `cancellation_key` | DELETE by `transactionId` | `cancelation_token` or `run_id` | `abort` step; no cancel API confirmed | Cancel API, Cancel Workflow node, Wait Until |
| Recurring schedules | Yes, per-recipient schedules API | Scheduled delay and digest windows | Not confirmed | Not found | Not confirmed |
| Free tier | 10k messages/mo | 10k runs/mo, 5 workflows, 24h log | 10k sends/mo | 1k deliveries/mo | 10k notifications/mo (preferences and digest not included) |
| First paid tier | Starter $250/mo, 50k messages, then $0.005 each | Pro from $30/mo, 30k runs, then $1.20 per 1k | Business $0.005 per send from the first send ($250 for 50k) | Startup $249/mo, 50k, then $0.0025 each | Essentials $100/mo (no preferences or digest); Business $250/mo, 50k |
| Email later | Same workflow, add an email step (provider billed separately) | All channels on all plans | Same template routes to email; multi-channel counts as 1 send | Email via SMTP, SendGrid, Mailgun, SES | Unlimited channels on Free |
| Self-host | No | Community edition (free) or paid Enterprise self-hosted | No | No | Enterprise only (self-host or BYOC beta) |

## 1. Prebuilt React inbox and bell components

- **Knock.** `@knocklabs/react` provides `NotificationIconButton` (a bell with the unread or unseen count), `NotificationFeedPopover` and `NotificationFeed` (full page). It also includes "a complete set of React hooks that you can use to build your own UI." Styling uses `--rnf-*` CSS variables or full CSS replacement. `renderItem` replaces a feed cell, `colorMode="dark"` switches the theme, and there are `renderHeader`, `onNotificationClick` and `i18n` props. Sources: [React overview](https://docs.knock.app/in-app-ui/react/overview), [Feed customisation](https://docs.knock.app/in-app-ui/react/feed).
- **Novu.** `@novu/react` provides `<Inbox />`, made of composable `Bell`, `Notifications`, `InboxContent` and `Preferences` parts. The docs say you can "Override styles, replace every UI elements and icons." Tabs, filters, localisation, snooze and preferences are built in. Hooks, or `@novu/js`, support a fully custom UI. Source: [Inbox overview](https://docs.novu.co/platform/inbox/overview).
- **Courier.** `@trycourier/courier-react` (React 18+) provides `CourierInbox`, `CourierInboxPopupMenu`, `CourierToast` and `CourierPreferences`. These are themed with `CourierInboxTheme`, `CourierToastTheme` and `CourierPreferencesTheme`. `useCourier()` exposes `inbox`, `toast`, `preferences` and `auth`. Your server must mint a JWT scoped to the user. Older `@trycourier/react-inbox` packages are deprecated. Sources: [React SDK](https://www.courier.com/docs/sdk-libraries/courier-react-web), [Inbox overview](https://www.courier.com/docs/platform/inbox/inbox-overview).
- **MagicBell.** `@magicbell/react` provides `ContextProvider`, `FloatingInbox` (a panel that opens from a bell) and `Inbox`. The docs list "customizable notification rendering." It needs a User JWT generated on your server. The headless hooks (`useNotifications`, `useBell`) are in `@magicbell/react-headless`. That package belongs to the older `@magicbell/magicbell-react` generation, so check that it still pairs with the current package. Sources: [In-app channel](https://www.magicbell.com/docs/channels/in_app), [React headless](https://magicbell.com/docs/libraries/react-headless).
- **SuprSend.** `@suprsend/react` offers drop-in components ("Pre-built UI with many customizable options") or a headless build. `@suprsend/react-inbox` has reached end of support. The React `Inbox` handles the WebSocket connection, pagination and realtime updates. Sources: [React inbox](https://docs.suprsend.com/docs/inbox-react), [Preferences](https://docs.suprsend.com/docs/js-preferences).

## 2. Node server SDK

All five publish an official Node/TypeScript package. Versions are from the npm registry as of 2026-11-14:

| Vendor | Package | npm description |
|---|---|---|
| Knock | `@knocklabs/node` 1.41.1 | "The official TypeScript library for the Knock API" |
| Novu | `@novu/api` 3.19.1 | Novu API SDK |
| Courier | `@trycourier/courier` 10.0.0 | "The official TypeScript library for the Courier API" |
| MagicBell | `magicbell-js` 1.8.0 | Generated from the "OpenAPI 3.1.0 Specification for MagicBell API" |
| SuprSend | `@suprsend/node-sdk` 1.15.1 | "Suprsend Node SDK to trigger workflow from backend" |

All five trigger notifications the same way: call a workflow by key, pass the recipient ID and a data payload. For Cadence, that means sending a Student's ID as the recipient ID. None of them needs Cadence's database, so SQLite/Drizzle has no effect on the choice.

## 3. Delays, digests and scheduling: who detects inactivity?

**No vendor watches Cadence's data.** None can notice on its own that a Student has stopped Watching. Every vendor only knows about events Cadence sends. That leaves two patterns:

1. **Delay-then-cancel inside the vendor.** When a Student watches a lesson, Cadence triggers a "come back" workflow with a long delay and a cancellation key such as the Student ID. Each later Watched event cancels the pending run and starts a new one. The vendor only sends if the delay runs out with no new activity. All of these support the pattern except MagicBell, where no cancel API was confirmed.
2. **Cadence detects inactivity.** A scheduled job queries SQLite for Students with no recent Watched activity and triggers a workflow. Any vendor works with this.

Per vendor:

- **Knock.** Delays can be a fixed interval, a dynamic value from data, an absolute timestamp, relative to a timestamp, or a time window. The maximum is 365 days. You cancel by passing a `cancellation_key` at trigger time and later calling the cancel API, at least 5 seconds after the trigger. The docs also describe a wait-for-event step that pauses "until a matching event is received or the wait time expires." Batch and digest are on every plan. The schedules API offers recipient-timezone-aware cron jobs, recurring or one-off. Sources: [Delay](https://docs.knock.app/designing-workflows/delay-function), [Cancelling](https://docs.knock.app/send-notifications/canceling-workflows), [Schedules](https://docs.knock.app/concepts/schedules), [Pricing](https://knock.app/pricing).
- **Novu.** Delays can be fixed, scheduled (in the subscriber's timezone) or dynamic. **The maximum delay depends on the plan: 1 day on Free, 7 days on Pro, 30 days on Team.** Digest windows have the same caps. A 14-day inactivity nudge therefore needs the Team plan, or detection in Cadence. Cancelling uses `DELETE /v1/events/trigger/{transactionId}`, which stops active or pending workflows. Sources: [Delay](https://docs.novu.co/platform/workflow/add-and-configure-steps/configure-action-steps/delay), [Digest](https://docs.novu.co/platform/workflow/add-and-configure-steps/configure-action-steps/digest), [Cancel](https://docs.novu.co/api-reference/events/cancel-triggered-event).
- **Courier.** Journeys support `send`, `delay`, `branch`, `fetch`, `throttle`, `batch`, `add-to-digest` and `exit` nodes, plus a cancel node. A delay is relative or absolute, at most 90 days per node; chain nodes for longer gaps. One Courier page says 93 days, so the docs disagree. You cancel by `cancelation_token`, which cancels every run sharing it, or by `run_id`. Sources: [Journeys](https://www.courier.com/docs/journeys/overview), [Pricing](https://www.courier.com/pricing).
- **MagicBell.** Workflows have four commands: `broadcast`, `wait` (in seconds), `pause` (until resumed through the API) and `abort`. Steps can be gated with an `if` condition, and "More commands coming soon." No digest or cancel API was found. With MagicBell, Cadence would most likely detect inactivity itself. Source: [Workflows](https://www.magicbell.com/workflows).
- **SuprSend.** Delays are fixed, dynamic or relative. The docs don't state a maximum. **Wait Until** halts a run "until a condition is met or a specific time interval is reached" and can match on event properties. There is a cancel API with a cancellation key and, recently, a Cancel Workflow node. Batch and digest require the **Business** plan. Sources: [Delay](https://docs.suprsend.com/docs/delay), [Changelog](https://docs.suprsend.com/changelog/overview), [Pricing](https://www.suprsend.com/pricing).

## 4. Per-recipient preferences (muting message types)

- **Knock.** Each recipient has a `PreferenceSet` that can turn off `workflows`, `categories`, `channel_types` or `channels`. Anything unset counts as true. Knock offers environment-level defaults, a hosted preference page from a signed URL, or a custom UI. Preferences are on every plan. Sources: [Preferences](https://docs.knock.app/preferences/overview), [Pricing](https://knock.app/pricing).
- **Novu.** Preferences come in layers: workflow defaults, then subscriber global, then subscriber per-workflow, and the most specific layer wins. A workflow marked **critical** can't be muted, which suits transactional messages such as a decided Refund Request. The `<Inbox />` includes a Preferences view. Source: [Preferences](https://docs.novu.co/platform/concepts/preferences).
- **Courier.** Topics are grouped into sections. Each topic defaults to opt-in, opt-out or **required** (users can't opt out). The `CourierPreferences` component handles topics, channels and digest schedules, and there is also a hosted page. Sources: [Preferences](https://courier.com/docs/platform/preferences), [Embedding](https://www.courier.com/docs/platform/preferences/embedding-preferences).
- **MagicBell.** Preferences are set per category and per channel through the API. The docs describe a "preferences UI" but no React preferences component was found. Sources: [In-app](https://www.magicbell.com/docs/channels/in_app), [User primitive](https://www.magicbell.com/docs/primitive/user).
- **SuprSend.** Preferences are per category and sub-category, and per channel within a category. Every preference is saved against a tenant. React hooks include `updateCategoryPreference`. **User preferences are a Business-plan feature ($250/mo).** Sources: [User preferences](https://docs.suprsend.com/docs/user-preferences), [Pricing](https://www.suprsend.com/pricing).

## 5. Pricing at a small-to-mid Student base

Volume assumption, for illustration only: 1,000 to 5,000 active Students receiving about 4 to 10 in-app notifications each per month, or roughly **4k to 50k messages a month**. Each vendor counts differently: messages, workflow runs, sends, deliveries or notifications.

| Vendor | Free tier | ~10k/mo | ~50k/mo | Notes |
|---|---|---|---|---|
| Knock | 10k messages, all core features, 30-day logs | $0 | $250 (Starter) | No hard cap: Knock contacts you if you go over without billing set up. |
| Novu | 10k runs, 5 workflows, 2 environments, 24h logs, 1-day max delay and digest | $0 (5-workflow cap) | Pro: $30 + 20k × $1.20/1k = ~$54. Team (needed for 30-day delays): $250 | Pro allows 20 workflows and 7-day delays; Team allows 100 and 30 days. |
| Courier | 10k sends | $0 | $250 (Business, $0.005 × 50k) | Business charges every send, including the first 10k. One template sent on several channels counts as 1 send. |
| MagicBell | 1k deliveries | $249 (Startup) | $249 | The free tier is small. Overage is $0.0025 per delivery. |
| SuprSend | 10k, but no preferences or digest | $250 if preferences or digest are needed; otherwise $0 | $250 (Business) | Essentials ($100) drops branding but still lacks preferences and digest. Business overage is $5 per 1k. |

Sources: [Knock](https://knock.app/pricing), [Novu](https://novu.co/pricing), [Courier](https://www.courier.com/pricing), [MagicBell](https://www.magicbell.com/pricing), [SuprSend](https://www.suprsend.com/pricing).

## 6. Path to adding email later

All five are multi-channel. Adding email means adding an email step to an existing workflow and connecting an email provider. The provider (Postmark, SendGrid, SES and so on) is billed separately, as Knock and SuprSend say explicitly.

- Knock prices per message, so an in-app plus email notification counts as 2 messages.
- Novu includes every channel on every plan.
- Courier counts a multi-channel send of one template as 1 send.
- MagicBell supports SMTP, SendGrid, Mailgun and SES.
- SuprSend includes unlimited channels on Free.

Knock and Novu both document the pattern of emailing only if the in-app message is still unread after a delay.

## 7. Self-hosted Novu: is it clearly better?

- **What it is.** The Novu Community edition is free to self-host. The GitHub repo (`novuhq/novu`, about 40k stars) reports a non-standard ("Other") license. Paid Enterprise self-hosting offers parity with Cloud.
- **Infrastructure.** Even the single-VM option needs 4 vCPU and 8 GB RAM for the services, plus **MongoDB**, **Redis** with AOF persistence, and 10 GB of S3-compatible storage. The recommended multi-VM setup runs 3 VMs each for API, Worker and WS, two 8 GB Redis clusters and a MongoDB Atlas M20 cluster. Cadence uses none of these today: it runs SQLite.
- **What's missing compared with Cloud.** Snooze, removing Novu branding (in the Inbox and email), SSO, MFA, RBAC, translations, custom environments and compliance certifications. The team is capped at **1 member**. The Bell, Inbox, preferences and digest components are included.
- **Assessment against the #7 rule ("self-hosted only if clearly better").** It isn't clearly better. It avoids per-run fees, but at Cadence's volume Novu Cloud's fees are $0 to $54 a month. In exchange, Cadence would run three new pieces of stateful infrastructure and give up branding removal and snooze.

Sources: [Self-hosting overview](https://docs.novu.co/community/self-hosting-novu/overview), [Self-hosted vs Cloud](https://docs.novu.co/community/self-hosted-and-novu-cloud), [GitHub API](https://api.github.com/repos/novuhq/novu).

## Open questions for the grilling ticket

- **Where to detect inactivity.** In the vendor (delay-then-cancel on each Watched event), or in Cadence (a scheduled query over SQLite)? Novu's plan caps on delays and MagicBell's missing cancel API matter only if detection lives in the vendor.
- **How long the inactivity windows are.** Windows over 7 days rule out Novu Pro for vendor-side detection, and windows over 30 days rule out Novu entirely.
- **Whether Student preferences are needed at launch.** If they are, SuprSend is $250/mo from the start.
- **How much the bell must match Cadence's UI.** Knock, Novu and Courier document the most customisation for their prebuilt components.

## Unverified or conflicting

- Courier's maximum delay: 90 days on the Journeys page, 93 days on another page.
- Whether MagicBell has a cancel API or digest. Neither was found.
- SuprSend's maximum delay, and how its pricing table splits delay and throttle features by plan. The checkmarks didn't survive text extraction.
- Novu's Free-tier overage behaviour. The relevant FAQ answer wasn't extractable.
- Whether Courier's Journeys feature is on the free Developer plan. The pricing page lists "Journeys and broadcasts" under Developer, but the Journeys docs don't say.
