# Gateway Skill Creator - Skill Log

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.3 | 2026-01-31 | Initial implementation from 100/100 spec |

---

## Design Decisions

### Why Three Gateway Types?
- **MCP:** For services with MCP servers configured in Claude Code
- **CLI:** For custom CLI tools that don't have MCP wrappers
- **HTTP:** For REST APIs that are easier to call directly than wrap in MCP

### Why Config Invariants?
Prevents invalid combinations like `mcp + gateway_managed` which would be confusing (gateway_managed implies the gateway controls lifecycle, but MCP lifecycle is owned by Claude Code).

### Why Opportunistic Cleanup?
Skills cannot run background monitors. Cleanup at invocation start is the only reliable way to manage idle timeouts.

### Why Collision Scoring with Token Categories?
- Service tokens (telegram, slack, etc.) are high-signal - overlap means likely conflict
- Generic tokens (send, check, message) are low-signal - common words that shouldn't trigger false positives

---

## Known Limitations

1. **MCP gateways cannot spawn processes** - Claude Code owns MCP lifecycle
2. **No background idle timeout monitor** - relies on opportunistic cleanup
3. **Entity resolution requires resolver_tools** - otherwise asks user for IDs
4. **HTTP gateways use curl only** - WebFetch availability varies

---

## Future Improvements

- [ ] Add gateway migration tool (upgrade v2.2 → v2.3)
- [ ] Add gateway status dashboard
- [ ] Add automatic trigger phrase suggestions based on service name
- [ ] Add integration tests for each gateway type

---

## Lessons Learned

1. **Specify everything** - "implicit" behavior causes confusion
2. **Config validation is critical** - invalid combos should fail fast
3. **Deterministic measurements** - `ps | grep` is unreliable, parse config files instead
4. **Lock files need TTL + stale detection** - simple locks cause deadlocks
