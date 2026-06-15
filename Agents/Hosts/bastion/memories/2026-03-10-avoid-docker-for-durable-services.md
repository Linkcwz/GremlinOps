# 2026-03-10 Avoid Docker for durable services (operator preference)

GENRE EXAMPLE: preference/constraint memory — an operator architectural
preference recorded with its rationale and a default decision order, so
agents stop re-proposing the thing the operator already declined.

Operator preference: avoid Docker containers for long-lived, stateful, or
daily-driver services when a mutable LXC or VM is practical.

Rationale:

- The operator prefers LXC/VM mutability: OS packages, shell setup, service
  tweaks, and ad-hoc recovery work survive reboots and restarts.
- Docker is acceptable for explicitly disposable workloads, packaged
  appliances where the image boundary is the intended operating model, or
  when the operator explicitly asks.

When proposing or rebuilding services, choose in this order unless there is a
concrete technical reason not to:

1. Existing service pattern already in the repo/environment.
2. Mutable LXC.
3. VM.
4. Docker/container stack — only when clearly the best fit or requested.

(The point of recording this is not that Docker is wrong; it's that an
unrecorded preference gets re-litigated by every fresh session forever.)
