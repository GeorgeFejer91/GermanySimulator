---
name: chatdev-game-workflows
description: Route a Germany Simulator episode through the project's scoped ChatDev story, character, color mood, animation, gameplay, sound, phone, voice and QA stages. Use when creating or refining a cross-domain Bürgeramt feature or the ChatDev production workflow itself.
---

# ChatDev game workflows

Use the canonical root game and [the project ChatDev protocol](../../../For-AI/chatdev/README.md). Choose only the domains the request changes. For a cross-domain episode pass, use the graph order and keep one integrator responsible for accepting stage output.

Each stage owns a concrete handoff. Story owns German spoken text and line tone. Storyboard maps beats and exits. Character locks identity, source art and physical prop hand. ColorMood coordinates valence, a restrained tint palette, and smooth return on the active speaker. Animation checks exact painted frames and movement triggers. Gameplay owns static JavaScript simulation and mission state. Soundscape owns cue design; Mix owns independent levels and speech priority. Phone owns the separate companion/transport. Voice owns licensed recordings. Review and QA examine the integrated game.

Run `tools/chatdev.ps1 -ValidateOnly` before using the external runner. Use `-Stage <name>` for one affected domain. The pinned ChatDev runner needs a local API key and writes only on a `codex/` branch; if it cannot run, report that limit and carry out the same bounded handoff locally. A validated graph is not an executed stage.

Keep binary art generation, playable integration and silent desktop/mobile browser review with the integrator. Never treat a ChatDev report, CPU test, or attractive source image as approval of the exact game frames, heard audio or paired-device phone transport.
