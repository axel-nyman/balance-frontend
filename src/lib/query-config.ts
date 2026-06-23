/**
 * Background polling interval for cross-device sync (item 060).
 *
 * The couple often has Balance open on two devices at once; polling the
 * user-visible read queries on this interval keeps the views in near-real-time
 * sync without any backend work. Kept generous (tens of seconds, not seconds)
 * to stay gentle on the Raspberry Pi, and React Query pauses it when the tab is
 * hidden (`refetchIntervalInBackground` defaults to false).
 */
export const POLL_INTERVAL = 30 * 1000
