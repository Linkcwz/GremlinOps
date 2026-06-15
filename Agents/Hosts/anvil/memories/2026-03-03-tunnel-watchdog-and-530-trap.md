# 2026-03-03 Public tunnel watchdog + the split-DNS validation trap

GENRE EXAMPLE: troubleshooting postmortem → durable automation + a recorded
trap for future agents.

Public `media.example.com` names can return edge `530` (tunnel down) while
local split-DNS access still works — so "it works for me locally" proves
nothing about the public path. Today the Windows tunnel service was installed
but stopped (prior exit code `1067`); starting it immediately restored the
tunnel.

Hardening applied:

- Service set to delayed-auto start with recovery actions (restart after 60s,
  first three failures, reset period 86400s).
- Watchdog: a hidden scheduled task every 5 minutes runs a check script that
  probes (1) the service state, (2) the local metrics endpoint, (3) the
  PUBLIC edge for three representative hostnames. Restarts the service if
  metrics fail, all public probes fail, or any probe returns `530`. Script +
  hidden launcher live in the repo; logs to a local log path.

**The trap (why this note exists):** on this network, resolving against a
public DNS server can STILL return local split-DNS answers for internal
names. Public-edge validation must filter RFC1918 addresses and pin the edge
explicitly (`curl --resolve host:443:<public-edge-IP>`), or the watchdog
"validates" through the local path and lies to you.

Recovery was tested, not assumed: stopped the tunnel service manually; the
watchdog restarted it; pinned public-edge probes returned `302/200` across
all five public services. Treat a future public `530` as a tunnel
process/connectivity problem FIRST, not an application-config problem — the
pre-repair logs showed DNS/SRV failures against the tunnel provider's
endpoints, not app errors.
