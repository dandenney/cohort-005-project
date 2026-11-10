# Only Admins decide Refund Requests, never the course's Instructor

Only an Admin (Cadence staff who run the platform, `UserRole.Admin`) may approve or decline a Refund Request. The Instructor who owns the course doesn't decide, even though the code elsewhere treats the owning Instructor and Admins together as `isStaff` for course matters. The Instructor has a financial interest in every Refund on their course, so letting them decide would make the outcome depend on who is asked.
