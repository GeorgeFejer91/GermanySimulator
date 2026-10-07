---
name: chatdev-game-workflows
description: Route Germany Simulator Bürgeramt work through Codex-led story, gameplay, timing, visual, phone, audio, runtime, and QA domains; optionally use the pinned legacy ChatDev runner when its limits and dependencies fit.
---

# ChatDev-inspired game workflows

Codex leads and integrates this project’s work. Read the current workflow and model/delegation rules in [`For-AI/SKILLS.md`](../../../For-AI/SKILLS.md), and the project’s episode rules in [`For-AI/chatdev/README.md`](../../../For-AI/chatdev/README.md). Choose only the domains the request affects. Keep one integrator accountable for contracts, acceptance, review, and any publication.

For music or nonverbal sound, read [`For-AI/MUSIC-SOUND-DESIGN.md`](../../../For-AI/MUSIC-SOUND-DESIGN.md) and the affected episode/gameplay section. Use the installed `$music-sound-effects` for reusable FOSS source and production methods when relevant; the episode/gameplay documents own cue-to-game-state behavior. Agree one beat ID and candidate revision across affected content, storyboard/animation, gameplay, soundscape/mix, phone/voice, and QA. The static controller commits events; use existing audio scheduling, buses, and asset authority. The runner can read the project protocol, but cannot directly read a personal skill: put the **actual beat ID, candidate revision, and compact beat contract** in every affected external stage prompt or tool-readable handoff, alongside any needed reusable skill guidance.

Use the external OpenBMB ChatDev runner only when its pinned sibling checkout, local runtime, and API configuration are available and it adds value. Validation is not execution; its stages currently name `gpt-4o`, have limited read/write tools, and its QA tool cannot run browser playtests. Do not promise external model execution or tool capabilities without checking them in the live environment. If it cannot run, use available Codex skills and tools for the same bounded domain handoffs and state the limitation.

For delegated work, follow the task brief, file-ownership, active-agent, and model-tier contract in `For-AI/SKILLS.md`. The legacy twelve-stage graph may inform handoff boundaries, but does not require running every stage. The integrator and relevant independent reviewers own actual integration, silent browser audio-state/timing checks, device evidence, exact animation review, paired-phone verification, and perceptual listening. Never accept a report, source image, CPU check, or emulated browser result as evidence for a different check.
