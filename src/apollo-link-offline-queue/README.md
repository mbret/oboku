# apollo-link-offline-queue

## Important
- The context passed along the query MUST be serializable. There would be missing information on restore otherwise.
- You SHOULD NOT add any delay on operation before this link since the operation may not be persisted in time. You can
do anything after the link.