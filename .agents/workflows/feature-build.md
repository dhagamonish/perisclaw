# Workflow: Feature Build

Follow this sequence for every new feature:

1.  **Understand**: Review `PRD.md` and `identity.md` to ensure the feature fits the soul of Astra.
2.  **Plan**:
    - Update `TASKS.md` with sub-tasks.
    - Draft the interface/service signature.
    - Identify risks (API limits, edge cases).
3.  **Log Decision**: If technical trade-offs are made, add an entry to `DECISIONS.md`.
4.  **Implement**:
    - Write code in small, commit-ready chunks.
    - Follow `engineering.md` standards.
    - Add logging at critical points.
5.  **Test**:
    - Run unit tests if applicable.
    - Manually verify the flow in the dev environment.
6.  **Document**:
    - Update `ARCHITECTURE.md` if the system diagram changes.
    - Update `README.md` if new environment variables are needed.
7.  **Finalize**:
    - Mark task as complete in `TASKS.md`.
    - Record progress in `WORKLOG.md`.
