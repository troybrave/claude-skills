---
name: plan-feature
description: Use when someone brings a fuzzy idea for a NEW feature, capability, product area, workflow, view, dashboard, intake flow, or report and wants help deciding what to actually build — pinning down scope and edge cases by talking it through, then cutting it into several independently-buildable, tracked issues. The defining signal is net-new product scope that becomes MULTIPLE pieces of build work. Triggers on "plan / scope / think through / grill me on / figure out [a feature]," "build out a whole [X]," "it's a whole area, not one ticket," "break it into issues/chunks," "what would it take, broken into buildable pieces," or "scope it before anyone writes code." Prefer this over generic brainstorming or grilling whenever the result is tracked, multi-issue build work. NOT for one already-understood change or a bug (new-issue), refactoring or deploying existing code, naming/content, or verifying/fixing existing issues (confirm-issue/fix-issue).
version: "1.0.0"
last-updated: "2026-07-01"
---

# plan-feature

The upstream front door to the pipeline. It converts a feature idea into a **Linear Project + child issues in Triage**, then stops. From there the existing pipeline takes over unchanged: `confirm-issue` verifies each child issue and writes its `## Fix Plan`, moves it to assigned Todo under the Todo gate, and `fix-issue` / `fix-queue` build it.

This skill exists because the expensive failure in agentic dev is bloat-by-iteration: build something, change it, change it again, then realize 80% wasn't wanted and unwind it. An hour of structured thinking up front converts into dozens of hours of clean autonomous work — *if* the scope is right before issues exist. So the value of this skill is in the clarifying questions and in grounding them in what already exists, not in generating a long issue list.

## The pipeline this feeds (verified, not assumed)

The Vaulted OS tracker is **Linear** (team `Vaulted OS`, key `VOS`, workspace `vaulted-os`). The downstream model is fixed:

- **Triage** = raw/unrefined intake. **Todo** = has a vetted `## Fix Plan` and a resolvable assignee. Agents fix from **Todo**.
- `confirm-issue` only verifies issues whose **type is `bug` or `task`** and that belong to the active operator's Triage lane. It explicitly routes `feature`/`epic`/`spike`/`chore` (and `infra`) to a human and refuses to plan them.

That second point is the load-bearing constraint for this skill: **the child issues you create must be typed `task` (or `bug`), never `feature`** — or `confirm-issue` will skip them and they will sit in Triage forever. The *feature* lives in the **Project**, which is the container. The children are the executable units that build it.

## What this skill does and does NOT do

**Does:**
- **Ground the plan in what already exists** — search Linear (Projects + issues), explore the codebase with an `Explore` agent, and read any matching design docs — before cutting scope.
- Run a conversational, Socratic planning session that pins down scope, edge cases, and explicit out-of-scope.
- Reuse or create one Linear **Project** for the feature, optionally with undated **milestones** — the native primitive for ordered in-project phases and team sync/QA checkpoints (the *stop* is enforced by `fix-queue`'s orchestration, not by Linear).
- Create **child issues in Triage**, each typed `task`/`bug`, area-tagged, assigned by `resolveOwner(area, project)`, linked to the Project, with build-order **`blockedBy` relations** where seams depend on each other — using the SAME issue shape `new-issue` produces.
- Write a short **design-doc artifact** capturing the North Star + out-of-scope, and hand off to the existing pipeline at the Triage boundary.

**Does NOT (these belong to other skills — do not reimplement them):**
- Reimplement research tooling. Internal grounding uses the `Explore` agent + the Linear MCP; **external** web/library research is **opt-in only** and delegated to the `deep-research` skill (Perplexity/Tavily/Firecrawl/WebSearch/Context7) — never run unprompted.
- Write a `## Fix Plan` (that's `confirm-issue`).
- Set any issue to Todo, In Progress, or beyond (the pipeline does that).
- Open a worktree, write code, or touch git for the *feature itself* (that's `fix-issue` / `fix-queue`).
- Create Cycles, Estimates, Sprints, or **dated/time-boxed** milestones. The team has rejected cadence ceremony; time is irrelevant to the agents. Milestones are allowed **only as undated build-phase ordering** (Phase 1/2/3), never a schedule. Projects also replace `epic`s, which is why child issues are never typed `epic`.
- Produce one giant feature-branch's worth of work. Issues must be independently fixable (see Scope discipline).

## The handoff contract (the line that must not break)

The skill ends by creating issues in **Triage**, in the exact shape `new-issue` emits:

- **title** — short, imperative, specific.
- **type** — `task` for net-new build work (the default here); `bug` only when the issue fixes existing behavior. **Never `feature`/`epic`** for a child issue — those are not pipeline-eligible (see above). Never invent labels, and **never `auto-code`** — planned issues are substantive Lane-B build work, not trivial coding-session candidates.
- **area** — `client-facing` · `bookkeeper` · `platform` · `backend`. Infer from where the operator *experiences* the work.
- **assignee** — set `assignee = resolveOwner(area, project)` from [`../ownership.md`](../ownership.md), same as `new-issue`. Planned work is never intentionally unowned.
- **priority** (Linear scale: `0`=None, `1`=Urgent, `2`=High, `3`=Medium, `4`=Low) — default planned issues to `3` (Medium): planning is deliberate, so unlike raw `new-issue` intake these aren't left at None. Park "nice to have eventually" at `4` (Low).
- **project** — the Project this session reused or created (every child links to it; this is what makes blast-radius queryable).
- **description** — the per-issue context (see Issue output below).

Because the issues come out in `new-issue`'s shape and land in Triage, `confirm-issue` cannot tell whether a human or this session created them. That is the point: **nothing after Triage changes.** Do not add fields the gates don't already parse, and do not set a status other than Triage.

## The Socratic session

The conversation is the product. Be question-driven and willing to push back — the operator is not a developer and is relying on you to surface what they haven't thought of. Do not jump to issues until scope is clear. Work through these in order; one focused question at a time, don't interrogate in bulk.

1. **The North Star of the feature.** What should this *be able to do*, in the operator's words? Capture the "why/what," not the "how." Mirror it back in one or two sentences and get agreement before going further.

2. **Ground it in what already exists** (do this before scoping — the #1 planning failure is re-scoping work that already exists or fighting the real architecture). This mirrors `grilling`'s rule: if a question can be answered by looking, look instead of asking.
   - **Linear**: `mcp__linear__list_projects { team: "Vaulted OS" }` and `mcp__linear__list_issues` filtered by the feature's keywords across Triage/Backlog/Todo — surface any Project or issues that already cover part of this.
   - **Codebase + docs**: dispatch ONE `Explore` agent to map the surfaces this feature touches (components, services, routes) and to find existing design docs under `docs/superpowers/plans/`, `docs/superpowers/specs/`, and `.claude/plans/`. Read the relevant one(s) rather than re-deriving them. Keep it lean — a single focused dispatch, not a sweep.
   - **External (opt-in only)**: if the feature is genuinely novel or the operator asks "what's standard / what do others do," offer to run the `deep-research` skill. Do not run external research unprompted — importing outside ideas is a common source of the very scope creep this skill fights.
   - **Report back** a short "here's what already exists" summary and let it inform the rest of the session (e.g., "there's already a `Reports` Project and a cash-flow-statement plan — this overlaps; want to extend that rather than start fresh?").

3. **The shape of the thing.** Walk the feature concretely. Who uses it, what they do, what comes back. Use a real scenario. Surface the edge cases that change the data model — e.g. "one person could be the admin for three different *clients*, not just three entities; do we handle that?" These are the questions that prevent rework, so spend time here.

4. **Boundaries — in and explicitly out.** What is NOT in this feature? Write the out-of-scope list down; it is as valuable as the in-scope list. If something is "maybe later," it becomes a low-priority (`4`) issue, not scope creep in an active one.

5. **Natural seams.** Where does the feature break into independent pieces? Each seam is a candidate `task`. Prefer seams that can be built and merged on their own (see Scope discipline). A good seam is one you can state as a single observable behavior — which is also what lets `confirm-issue` write a red-capable test for it. Note where one seam must land before another (build order) and where two seams share files (serialize) — both get encoded in Linear at creation time.

6. **Confirm the cut.** Before creating anything, lay out the proposed Project (+ any build-phase milestones), the issue list (titles + one-line each + type/area/priority), and the build-order dependencies, and get explicit sign-off. This is the cheap moment to cut an issue; once it's in Triage and confirmed, it costs a full cycle to unwind.

## Scope discipline (this is what prevents the merge-bomb)

The operators' hard-won rule: agents running wide produce an over-extended branch that's "a bomb when you merge it." This skill prevents that at planning time by producing issues that are **independently fixable**:

- Each issue should be buildable in its own worktree and shippable as its own PR. If an issue can't be described without "and also change X, Y, Z across the codebase," it's too big — split it.
- Each issue should be expressible as **one observable behavior**, so `confirm-issue` can write a reproduction test that goes red on today's code and green once it's built. A seam that can't be pinned to a testable behavior is a sign the scope is still fuzzy — keep questioning.
- Encode real dependencies in Linear, don't bury them in prose:
  - **build order → a `blockedBy` relation** (the Fixer enforces it — it won't build an issue whose blockers aren't Done).
  - **shared files → note "shares `<file>` with `<issue>` — serialize"** in the description (the downstream serial lane handles it).
  Never merge two pieces into one mega-issue just to avoid the overlap.
- Bias toward **fewer, well-scoped issues** over a maximal dump. A short list of clean issues beats a long list that has to be re-cut. It's fine — encouraged — to plant low-priority placeholder issues for "things AI should keep in mind but not build yet," but mark them `4` (Low) so the fixer leaves them alone.

## Creating the work in Linear

You create the Project, milestones, and issues yourself via the Linear MCP — same mechanics as `new-issue`. Relations need issue ids, which only exist after creation, so this is a **two-pass** flow. Load the Linear MCP tools first (`list_projects`, `save_project`, `list_milestones`, `save_milestone`, `list_issues`, `save_issue`, `save_comment`) — in Claude Code: `ToolSearch select:mcp__linear__list_projects,mcp__linear__save_project,mcp__linear__list_milestones,mcp__linear__save_milestone,mcp__linear__list_issues,mcp__linear__save_issue,mcp__linear__save_comment`. If tool search returns **0 tools** (Codex uses keyword search, not `select:`), search `linear list projects save project list milestones save milestone list issues save issue save comment` instead and use whichever names load (`mcp__linear__<x>` or `mcp__linear.<x>`).

1. **Reuse an existing Project before making a new one** (shared match/reuse rules: [`../projects.md`](../projects.md)). From the grounding step, you already know if one fits (reporting → `Reports`, categorization/forecasting → its Project, etc.). A duplicate, overlapping Project fragments the blast-radius queryability Projects exist for. Create a new Project (`save_project { team: "Vaulted OS", name, description }`) only when the feature is genuinely net-new scope. Put the North Star + a link to the design-doc artifact in the Project description.
2. **(Optional) Build-phase milestones.** Milestones aren't just ordering — `blockedBy` (Pass 2) already enforces build order. Linear milestones divide a project into ordered phases with issues bucketed under each, and Linear frames a milestone as a team **synchronization/checkpoint** ("where are we?") — exactly a human-QA/align gate between phases. But Linear enforces **nothing**: a milestone is a semantic boundary, not a hard stop. Use it to define the batch ("Phase 1 = these issues") and let `fix-queue`'s own orchestration do the actual **halt-and-QA at the milestone edge** before Phase 2. Add milestones when the cut has a point where you'd want to stop and verify before continuing — **especially where the risk profile changes** (a correctness/foundation phase that later phases build on top of). Create them undated (`save_milestone { project, name: "Phase 1 — <theme>" }` — **no `targetDate`**; sequence, not schedule; **not** Cycles, which are cadence/rhythm, not scope). `list_milestones { project }` first to reuse. Skip milestones when the whole cut is one QA batch — a flat 2–4 issue feature with no phase where you'd pause.
3. **Pass 1 — create each child issue** with `save_issue`, capturing the returned identifier (e.g. `VOS-312`) for pass 2:
   - `team: "Vaulted OS"`, `state: "Triage"`, `project: <the project>`, optional `milestone: <phase>`, `title`, `description`.
   - `labels: [<type>, <area>]` — `<type>` ∈ `{task, bug}`, `<area>` ∈ `{client-facing, bookkeeper, platform, backend}`. Both labels already exist. **Never create a new label** — label creation is admin-gated and will fail.
   - `assignee: <resolved owner>` — use [`../ownership.md`](../ownership.md): `backend`/`bookkeeper`→Matt, `client-facing`→Troy, `platform`→live Project lead or Matt when unleaded.
   - `priority` per the scale above (default `3`).
4. **Pass 2 — encode build order.** For each issue that depends on another, `save_issue { id: <dependent>, blockedBy: [<prerequisite id>] }` (append-only; `blocks` is the inverse if more natural). Do this only for genuine build-order dependencies, not stylistic preference — every relation is a constraint the Fixer will enforce.
5. **Pass 3 — cross-link to PRE-EXISTING related work** (additive, non-gating; full contract: [`../relations.md`](../relations.md)). The new issues are already a cohort (shared Project + your `blockedBy` edges), so connect them outward to work that *already existed*. Run the finder **once** for the whole batch with `--targets` (one tracker fetch; it auto-excludes the cohort from each other's candidates):
   `LINEAR_API_KEY=$(doppler secrets get LINEAR_API_KEY --plain --project vaulted --config dev) node "<repo>/.claude/skills/find-related.mjs" --scan --targets <new-id-1>,<new-id-2>,… --json`
   Act per `relations.md`'s **`MODE`** line — **`propose-only`** (default): `save_comment` the proposed links + top-3 medium "possibly related" leads, write no relations; **`auto`**: independent-confirm the top 1–2 high per issue (parallel, Haiku), then `save_issue { id, relatedTo: [VOS-X] }`; top-3 medium stay comment-only. Always `relatedTo`, never `blockedBy`, to pre-existing work; never edit the other issue's description.
6. Do **not** write a `## Fix Plan` or set any non-Triage state. Do assign the owner at creation via `resolveOwner(area, project)` so the issue appears in the correct operator's Triage lane.

## The design-doc artifact

After the cut is confirmed, write a short plan to `docs/superpowers/plans/<YYYY-MM-DD>-<feature-slug>.md` (matching the repo's existing plan convention) capturing: the **North Star**, the **shape/key edge cases**, the **explicit out-of-scope list**, and the **issue cut** (the list with ids once created, plus phases/dependencies). Reference its repo-relative path in the Project description. This preserves the *why* beyond the terse per-issue descriptions — Linear issue text is for the builder; this doc is for the next human who asks "why was it scoped this way."

## Issue output (per child issue)

Each issue's description carries enough for `confirm-issue` to pick it up cold. Keep it to plain-language intent — this skill does NOT write the technical plan:

```
## Context
<one paragraph: what this issue delivers and why, in observable-behavior terms>

## Part of
Project: <feature project name>  ·  Phase: <milestone, if any>
<if it shares files with sibling issues: "Shares <file> with <issue> — serialize">
Design doc: docs/superpowers/plans/<file>.md

## Out of scope
<the boundaries that apply to this specific issue, pulled from the session>
```

Leave the `## Fix Plan` section absent on purpose — `confirm-issue` writes it. An issue arriving in Todo without a plan, or with a plan this skill wrote, would break the eligibility gates.

## End of session

After issues are created, report back plainly:
- the Project name and link (reused or newly created), and any milestones
- the list of issues created (id, title, priority), grouped by area
- the build-order relations set and any "serialize" flags
- the design-doc path
- the explicit out-of-scope list, so it's on the record

Then stop. Do not confirm, plan, or fix — surface the work and let the operator (or the existing queue) take it from Triage. The natural next step is `start-work` / `confirm-issue` over the new Triage issues.

## Example (abbreviated)

**Operator:** "I want a feature where clients can text-message things in."

**Session (compressed):** Establishes the North Star ("clients submit documents/questions by SMS, they land in the right client's workspace"). **Grounds it:** an `Explore` pass finds an existing receipt-processing SMS webhook and a `Document Intelligence` Project — so this extends known surfaces, not greenfield. Surfaces the edge case that one sender may map to multiple clients — decides senders are matched per-client, unmatched senders go to a review queue. Bounds it: SMS intake + routing in scope; outbound replies and a full conversation UI explicitly out (becomes a `4`-priority placeholder issue). Cuts along seams, each a single testable behavior: inbound webhook (`backend`), sender→client matching (`backend`, **blocked by** the webhook), workspace drop + review queue for unmatched (`bookkeeper`), client-facing opt-in/number config (`client-facing`).

**Output:** reused the `Document Intelligence` Project + two phases ("Phase 1 — Intake", "Phase 2 — Routing & UI"); four Triage issues, all typed **`task`** and assigned by area (one at priority `4`); a `blockedBy` relation from matching → webhook; the `client-facing` issue flagged to serialize with matching since they share the config model; a design doc at `docs/superpowers/plans/2026-06-29-sms-intake.md`. Handed off; `confirm-issue` verifies each and takes it from there.

## Version History
- **v1.0.0 — versioning baseline (2026-07-01)**: first tracked version; captures current behavior as of this date.
