# Student-facing events in Cadence

Research for [#9](https://github.com/dandenney/cohort-005-project/issues/9), part of the map [#7 In-app notifications for Students](https://github.com/dandenney/cohort-005-project/issues/7).

**Question:** Which Student-facing events does Cadence already produce that could trigger a notification? For each one: where it happens, what data is available at that point, and whether it is persisted (so it can be detected later) or only exists during the request.

**Sources:** the code on branch `prune-the-glossary` (commit `979e285`): `app/routes`, `app/lib`, `app/db/schema.ts` and `app/components/youtube-player.tsx`, plus `GLOSSARY.md` and `docs/adr`. All line numbers refer to that commit. Terms follow `GLOSSARY.md`: Student, Instructor, Platform Admin, Team Admin, Enrollment, Seat, Refund Request, Watched.

> This supersedes an earlier inventory taken from `main` (branch `research/student-events`). See [What changed from the `main` inventory](#what-changed-from-the-main-inventory).

## Summary

| Event | Where | Persisted? | Email today? |
|---|---|---|---|
| Enrollment via Individual Purchase | `app/routes/courses.$slug.purchase.tsx:366-372` | Yes: `purchases.createdAt`, `enrollments.enrolledAt` | No. There is a stub at `:173-175` |
| Team Licence bought (Seats created) | `courses.$slug.purchase.tsx:375-379`, `createTeamPurchase` `:245`, `generateCoupons` `:222-243` | Yes: `coupons.createdAt` | No. The buyer is not enrolled |
| Enrollment via Claimed Seat (redeem) | `app/routes/redeem.$code.tsx:47-115`, called at `:201` | Yes: `coupons.redeemedAt` and `redeemedByUserId`, `enrollments.enrolledAt` | No |
| Lesson opened (in progress) | lesson loader `app/routes/courses.$slug.lessons.$lessonId.tsx:733-735` → `markLessonInProgress` `:245-269` | Status only. **No timestamp** | — |
| Video play / pause / ended / progress | `app/routes/api.video-tracking.ts:15-41`, sent from `app/components/youtube-player.tsx:115-119,167-177` | Yes: `video_watch_events` (one row per event, `createdAt`) | — |
| Lesson completed | `mark-complete` intent `courses.$slug.lessons.$lessonId.tsx:947-950` → `markLessonComplete` `:218-243` | Yes: `lesson_progress.completedAt` | — |
| Course completed | **Nowhere** | **No.** `enrollments.completedAt` is read but never written | — |
| Quiz attempted / passed | `submit-quiz` `:952-975` → `computeResult` `:531-638` | Yes: `quiz_attempts` (`score`, `passed`, `attemptedAt`), `quiz_answers` | — |
| Student question or reply posted | `create-comment` `:898-910` → `createComment` `:404-435` | Yes: `comments` (`parentId`, `createdAt`) | — |
| Instructor / Platform Admin answer | `app/routes/instructor.questions.tsx:188-222`, or a reply on the lesson page | Yes, as a reply row. "Answered" is derived (`:42-70`), with no flag | — |
| Refund Request raised | `app/routes/courses.$slug.refund.ts:63-77` → `raiseRefundRequest` `app/lib/refunds.server.ts:357-408` | Yes: `refunds` row, `status=open`, `requestedAt` | **Yes**, `sendEmail` `:75` |
| Refund Request approved | `app/routes/admin.refunds.tsx:94-139` → `approveRefundRequest` `refunds.server.ts:614-685` | Yes: `status`, `resolvedAt`, `resolvedByUserId`, `decisionNote`, `amountRefunded`. Enrollment deleted, or Unclaimed Seats get `refundedAt` | **Yes**, `sendEmail` `admin.refunds.tsx:130` |
| Refund Request declined | same route → `declineRefundRequest` `refunds.server.ts:692-731` | Yes: same columns. `decisionNote` is required | **Yes**, same call |
| Refund Pending / Issued / Failed | **Not built** | **No.** No payout state or table | — |
| Module / Lesson added | `app/routes/instructor.$courseId.tsx:722-725` (`add-module`), `:753-764` (`add-lesson`) | Yes: `modules.createdAt`, `lessons.createdAt` | — |
| Lesson content or video changed | `app/routes/instructor.$courseId.lessons.$lessonId.tsx:66-91,207` | **No timestamp** (`lessons` has no `updatedAt`) | — |
| Course status change (e.g. published) | `instructor.$courseId.tsx:695-698`, `app/routes/admin.courses.tsx:141-143` | Only `courses.updatedAt`, which every course edit bumps. There is no `publishedAt` | — |

## Enrollment

The schema is at `app/db/schema.ts:121-137`. An `enrollments` row holds `userId`, `courseId`, `enrolledAt` and `completedAt`.

### Individual Purchase

`courses.$slug.purchase.tsx:366-372` calls `createPurchase` (`:180-191`, which stores `amountPaid` and `country`) and then `enrollUser(currentUserId, course.id, false, false)` (`:145-178`), then redirects to `/courses/:slug/welcome`.

- **Data available:** the user id, the course row, the price paid after PPP, and the country.
- `enrollUser` has a `sendEmail` flag and an empty `// Would send welcome email here` block at `:173-175`. The only caller passes `false`, so this is a natural hook that nothing uses yet.
- The two inserts are not wrapped in a transaction.

### Team Licence

At `:375-379` the Team Admin gets a `purchases` row plus `quantity` Seats (`coupons` rows, `:222-243`). **No Enrollment is created for the buyer**, which matches the glossary. That makes it a Team Admin event rather than a Student one.

### Claimed Seat (redeem)

`redeem.$code.tsx:47-115` (`redeemCoupon`) checks four things:

- the Seat is not already claimed
- `getSeatAvailability` is not `on_hold` (an Open Refund Request exists) and not `refunded`
- the Student has no existing Enrollment
- the Student's country matches the purchase country

It then sets `coupons.redeemedByUserId` and `redeemedAt` (`:97-103`) and inserts an Enrollment (`:105-109`). These writes are not in a transaction.

- **Data available:** the Seat, its `purchaseId` and `teamId`, and the course.
- The same event could also notify the **Team Admin** that a Seat was claimed.

## Watched progress, lessons and course completion

### `api.video-tracking.ts`

`api.video-tracking.ts:29-38` inserts one `video_watch_events` row per call: `userId`, `lessonId`, `eventType` (free text) and `positionSeconds`. The `createdAt` column is at `schema.ts:363-376`.

The client sends `progress` every 10 seconds while playing (`youtube-player.tsx:115-119`), plus `play`, `pause` and `ended` (`:167-177`). The client only sends events when `trackingEnabled` is true, which is `enrolled && !!currentUserId` (`lessons.$lessonId.tsx:1164`). **The endpoint itself checks login but not Enrollment.**

- **Watched** (glossary) is computed on demand. `getSecondsWatched` (`refunds.server.ts:157-177`) takes the maximum `positionSeconds` per lesson and adds them up. The refund rules use it against `REFUND_WATCH_LIMIT_SECONDS`.
- `video_watch_events` has **no index** (`schema.ts:363`). Any per-user scan, such as Watched or "last watched", will read the whole table.

### Lesson in progress

The lesson **loader** calls `markLessonInProgress` on every view by an enrolled Student (`lessons.$lessonId.tsx:733-735`). It sets `status=in_progress` and records **no timestamp**. `lesson_progress` only has `completedAt` (`schema.ts:139-155`).

### Lesson completed

Completion happens only when the Student presses the manual **Mark complete** button. The `mark-complete` intent (`:947-950`) leads to `markLessonComplete` (`:218-243`), which sets `status=completed` and `completedAt`.

The `ended` video event does **not** complete a lesson, and nothing derives completion from Watched.

### Course completed

**Course completion is not implemented.** `enrollments.completedAt` is read in `dashboard.tsx:27`, `courses.tsx:122`, `instructor.$courseId.tsx:375,634` and `instructor.$courseId.students.tsx:39`, but no code writes it. A "you finished the course" notification would first need a rule (all lessons completed? Watched past a threshold?) and a write.

## Quizzes

`submit-quiz` (`lessons.$lessonId.tsx:952-975`) calls `computeResult` (`:531-638`), which:

- scores the answers
- inserts `quiz_attempts` (`score`, `passed`, `attemptedAt`) at `:602-611`
- inserts one `quiz_answers` row per answered question

**Data available:** the score, `passed`, a grade, and per-question results.

**Gap:** `passed` is hard-coded as `scoreValue > 0.7` (`:599`). It ignores `quizzes.passingScore` (`schema.ts:163`), so a "you passed" notification would inherit this bug.

## Student questions and Instructor answers

All questions and answers live in `comments` (`schema.ts:329-361`):

- a top-level comment is a question (`parentId` null)
- replies are one level deep
- `editedAt` and `deletedAt` (soft delete) are separate columns

**Student posts.** These go through `create-comment` (`lessons.$lessonId.tsx:898-910`) into `createComment` (`:404-435`). The route checks access with `requireContentAccess` (`:894`).

**Instructor / Platform Admin answers.** These come from either of two places:

- the queue at `instructor.questions.tsx:188-222`, which requires `requireStaff` and inserts a reply with `parentId = question.id` via its own `createComment` (`:118-158`)
- a reply posted on the lesson page by staff

**"Answered" is derived, not stored.** `getUnansweredQuestions` (`instructor.questions.tsx:42-70`) treats a question as answered when it has a non-deleted reply by an Admin or by the course's Instructor.

**Data available on reply:** the reply author, `parentId`, which gives the question's author (the Student to notify), and the `lessonId`. A notification hook would go after the insert in either `createComment`. It would check whether the reply author is staff and whether the parent's author is a Student.

## Refund Requests

On this branch, Refund Requests are fully built in `app/lib/refunds.server.ts`. Two naming notes:

- The table is called `refunds` (`schema.ts:232-257`) but each row is a **Refund Request**. Its status is `open`, `approved` or `declined`.
- A Seat is the `coupons` table.

### Raised

`courses.$slug.refund.ts:32-78` calls `raiseRefundRequest` (`refunds.server.ts:357-408`). This inserts a `refunds` row with `status=open`, `reason` and `requestedAt`. It returns an `Email` to the buyer, which the route sends at `:75`.

### Decided

`admin.refunds.tsx:94-139`, behind `requirePlatformAdmin`, calls one of two functions:

- **`approveRefundRequest`** (`refunds.server.ts:614-685`) runs in a transaction. For a **Team Licence**, it refuses if any Seat is claimed (ADR 0003); otherwise it sets `coupons.refundedAt` on every Unclaimed Seat (`:637-643`). For an **Individual Purchase**, it deletes the buyer's Enrollment unless they also hold a Claimed Seat for the course (`:644-666`, ADR 0004); progress is kept (ADR 0001). It then sets `status=approved`, `amountRefunded`, the optional `decisionNote`, `resolvedAt` and `resolvedByUserId`.
- **`declineRefundRequest`** (`:692-731`) requires a non-empty `decisionNote`, then sets `status=declined`, `resolvedAt` and `resolvedByUserId`.

Both return an email built by `buildDecisionEmail` (`:734-781`). The admin route sends it at `admin.refunds.tsx:130`.

**Already visible in the app:** the buyer can see the decision and the note on `/settings` (`settings.tsx:52,227-230`, via `listRefundRequestsForBuyer`) and on `/team` (`team.tsx:360,403-406`). That is a passive status display, not a notification.

**Losing an Enrollment (Lapsed)** happens as a side effect of approval. Since the Enrollment row is deleted, the event can only be recovered from the `refunds` row (`status=approved`, `resolvedAt`).

### Refund issued / failed

**Not implemented.** The glossary defines Pending, Issued and Failed Refund, and ADR 0002 says money movement "is handled separately". But no code or schema tracks payout. `amountRefunded` is set at approval time and nothing records whether the money was sent. Notifying a Student about an "Issued Refund" or "Failed Refund" needs new state, such as a payout status and timestamp.

## New modules and lessons on an enrolled course

- **Module added:** `instructor.$courseId.tsx:722-725` → `createModule` (`:207-229`). It records `modules.createdAt`.
- **Lesson added:** `:753-764` → `createLesson` (`:265-288`). It records `lessons.createdAt`. A lesson starts with no content or video, and **there is no draft or published state per lesson**. A lesson becomes visible to enrolled Students the moment it is created, empty, so "new lesson" is noisy as a trigger.
- **Lesson edited:** `instructor.$courseId.lessons.$lessonId.tsx:66-91` (`update-lesson`, `:207`). It does not record a timestamp, because `lessons` has no `updatedAt`.
- **Course status:** changes at `instructor.$courseId.tsx:695-698` and `admin.courses.tsx:141-143` bump `courses.updatedAt`, as does every other course edit (`instructor.$courseId.tsx:145-200`). No `publishedAt` exists.

To find who to notify, list a course's Students with `enrollments where courseId = ?`, which is indexed by `enrollments_course_idx`.

## Inactivity detection

**There is no last-watched or last-active timestamp.** `users` has only `createdAt` (`schema.ts:47-57`). Sessions and sign-ins are not recorded. Page views are not stored, and `markLessonInProgress` sets no time.

The best approximation from existing data is the latest of:

- `video_watch_events.createdAt`. This is the strongest signal, written every 10 seconds of playback. `getLastWatchPosition` (`lessons.$lessonId.tsx:271-286`) already queries the latest event per user and lesson.
- `lesson_progress.completedAt`
- `quiz_attempts.attemptedAt`
- `comments.createdAt`

**Gaps:**

1. `video_watch_events` has no index on `(userId, createdAt)`.
2. Reading a text-only lesson, without a video, leaves no timestamped trace.
3. There is no scheduler, cron job or background worker in the repo. The only `setInterval` is the client-side tracking timer. Time-based triggers like "inactive for 7 days" need a job runner, or a check on request.

A small fix would be to add `enrollments.lastActiveAt`, or `lastWatchedAt`, updated in `api.video-tracking.ts` and in the lesson loader.

## Reusable hooks

- **`app/lib/mailer.server.ts`** sends email through `sendEmail(email, transport?)` (`:67-72`). It uses Postmark when `POSTMARK_SERVER_TOKEN` is set, and otherwise writes JSON to `.outbox/`. The `MailTransport` interface (`:15-17`) is a clean seam: an in-app notification sink could be another transport, or sit alongside the email.
- **The domain functions already return messages.** `raiseRefundRequest`, `approveRefundRequest` and `declineRefundRequest` return an `Email` value (`refunds.server.ts:351,571`), and the route delivers it. Returning a notification payload next to the email would follow the same pattern, with no side effects inside the transaction.
- **`enrollUser`'s unused `sendEmail` flag** (`courses.$slug.purchase.tsx:148,173-175`) marks where an enrollment notification was meant to go.
- **There is no notifications table or in-app inbox.** Only email and the passive status display on `/settings` and `/team` exist.

## What changed from the `main` inventory

| Topic | `main` | `prune-the-glossary` |
|---|---|---|
| Terminology | Learner (Student to avoid) | **Student** (Learner to avoid) |
| Refund Request decided | Not implemented | **Implemented**: `approveRefundRequest` and `declineRefundRequest`, `decisionNote` column, emails the buyer |
| Email | Only `console.log` | **Real mailer** (`mailer.server.ts`, Postmark or `.outbox/`), used for raising and deciding Refund Requests |
| Seat claiming | `seats.$code.claim.tsx`, `seats` table | **`redeem.$code.tsx`** writes `coupons.redeemedAt` directly. It honours on-hold and refunded Seats |
| Refund storage | No `refunds` table | **`refunds` table** (one row per Refund Request). `coupons.refundedAt` marks Seats ended by approval |
| Refund Issued/Failed | Not implemented | Still not implemented |
| Course completion, lesson timestamps, last-active | Missing | Still missing |
