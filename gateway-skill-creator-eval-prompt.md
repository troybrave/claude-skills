# Evaluation Prompt: Gateway Skill Creator

> Use this prompt to have another agent evaluate and refine the Gateway Skill Creator specification.

---

## Prompt

```
You are a senior systems architect specializing in Claude Code skills and MCP (Model Context Protocol) integrations. I need you to evaluate a specification for a "Gateway Skill Creator" - a meta-skill that generates lightweight wrapper skills for lazy-loading MCP servers and CLI tools.

## Context

Claude Code skills have a two-layer architecture:
- **Frontmatter description**: Always loaded in every conversation (~50 tokens)
- **Skill body**: Only loaded when the skill triggers (~500-2000 tokens)

The problem: Users configure MCP servers that load at startup, consuming memory and context even when unused. Gateway skills solve this by creating lightweight wrappers that only start MCP servers (or call CLI tools) when explicitly invoked.

## The Specification

[PASTE THE FULL CONTENTS OF gateway-skill-creator-spec.md HERE]

---

## Evaluation Tasks

### 1. Architecture Review

Evaluate the gateway pattern architecture:
- Is the two-type model (MCP Gateway vs CLI Gateway) sufficient, or are there edge cases needing a third type?
- Is the ToolSearch-based approach for MCP correct, or should gateways explicitly manage server lifecycle?
- Are there race conditions or timing issues with the proposed flow?

### 2. Template Completeness

Review the MCP and CLI gateway templates:
- Are there missing sections that real-world gateways would need?
- Is the error handling comprehensive enough?
- Would you add or remove any sections?

### 3. Open Questions Resolution

The spec lists 5 open questions. For each, provide your recommendation with reasoning:

1. **MCP Server Lifecycle**: Explicit management vs implicit via ToolSearch vs hybrid?
2. **Multiple Operations**: Keep server running vs start/stop each time vs timeout-based?
3. **Gateway vs Always-On**: Are the guidelines for when to use each clear enough?
4. **Naming Convention**: `{service}-gateway` vs just `{service}`?
5. **Error Recovery**: Fail fast vs retry vs fallback?

### 4. Missing Considerations

Identify anything the spec doesn't address:
- Security concerns (env vars, credentials)?
- Performance implications?
- User experience issues?
- Edge cases not covered?
- Integration with existing Claude Code features?

### 5. Workflow Critique

Evaluate the 3-phase workflow (Discovery → Generate → Validate):
- Are the discovery questions sufficient?
- Is Phase 2 generation detailed enough for implementation?
- Are the validation requirements appropriate?

### 6. Success Criteria

The spec defines success criteria. Are they:
- Measurable?
- Complete?
- Missing any key metrics?

### 7. Implementation Risks

What could go wrong during implementation? Identify:
- Technical risks
- Usability risks
- Maintenance risks

---

## Deliverable Format

Provide your evaluation as:

1. **Executive Summary** (3-5 sentences): Overall assessment and key recommendation

2. **Architecture Verdict**: ✅ Sound / ⚠️ Needs Work / ❌ Redesign Required

3. **Open Questions Resolutions**: Table with your recommendations

4. **Critical Issues**: Numbered list of must-fix items before implementation

5. **Suggested Improvements**: Numbered list of nice-to-have enhancements

6. **Revised Success Criteria**: If you'd change them

7. **Risk Mitigation**: For each identified risk, a mitigation strategy

---

## Additional Context

This skill will be used by a single power user (not a team). The user:
- Has 10+ MCP servers configured
- Uses CLI tools extensively (located at ~/.claude/.CLI/)
- Values memory efficiency and clean context
- Wants simple invocation patterns
- Is comfortable with technical concepts

The gateway-skill-creator will be invoked with phrases like:
- "create a gateway skill"
- "make a gateway for Telegram"
- "lazy-load skill for Slack"
```

---

## How to Use This Prompt

1. Copy everything inside the code block above
2. Replace `[PASTE THE FULL CONTENTS OF gateway-skill-creator-spec.md HERE]` with the actual spec
3. Send to the evaluating agent
4. Collect the structured feedback
5. Use feedback to refine the spec before implementation

---

## Quick Copy Version

If the other agent has access to files, use this shorter version:

```
You are a senior systems architect specializing in Claude Code skills and MCP integrations.

Read and evaluate the Gateway Skill Creator specification at:
/Users/troybrave/.claude/skills/gateway-skill-creator-spec.md

Provide:
1. Executive Summary (3-5 sentences)
2. Architecture Verdict: ✅ Sound / ⚠️ Needs Work / ❌ Redesign Required
3. Open Questions Resolutions (table format)
4. Critical Issues (must-fix before implementation)
5. Suggested Improvements (nice-to-have)
6. Risk Mitigation strategies

Context: Single power user with 10+ MCP servers, values memory efficiency, wants simple invocation.
```
