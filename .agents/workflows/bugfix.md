# Workflow: Bugfix

Follow this sequence for every bug:

1.  **Reproduce**: Create a minimal script or test case that triggers the bug.
2.  **Inspect**: Check logs for error stack traces and state anomalies.
3.  **Hypothesize**: Identify the root cause (e.g., race condition, unhandled null, API change).
4.  **Fix**:
    - Apply the fix.
    - Ensure it doesn't break existing functionality (regression check).
5.  **Test**: Verify the fix using the reproduction script.
6.  **Log Lesson**: Add a "Lessons Learned" entry in `WORKLOG.md` or a technical note in `ARCHITECTURE.md` if it's a systemic issue.
