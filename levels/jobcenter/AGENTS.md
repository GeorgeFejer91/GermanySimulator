# Jobcenter level instructions

Read the repository [AGENTS](../../AGENTS.md) and [agent start](../../For-AI/AGENT-START.md) if they are not already loaded, then [this level's guide](./For-AI/README.md).

This scope covers the optional first-person flame encounter and its entry/return boundary. Its runtime remains [`jobcenter.js`](../../jobcenter.js), on the shared renderer and frame clock. Mission/reward state belongs to the city; read [city instructions](../city/AGENTS.md) for boundary changes. Shared root files require explicit write assignment.

Preserve native-media timing, early exit, visit-owned cleanup and stale-completion rejection. Keep its owning gameplay contract in [GAMEPLAY: Systems](../../For-AI/GAMEPLAY.md#systems), reading the Jobcenter entries only. Apply affected global review gates.
