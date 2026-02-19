# Skill Log: link-entity-airtable

## Metadata
- **Created:** 2025-12-29
- **Version:** 1.0.0
- **Clean Runs:** 0
- **Status:** New - Needs Testing

---

## Change History

### v1.0.0 (2025-12-29)
- Initial creation based on Blackhawk Logistics debugging session
- Documented all failure points discovered during manual troubleshooting
- Added known limitations section for Airtable automation dependency

---

## Known Issues

### Active Issues

| Issue | Severity | First Seen | Notes |
|-------|----------|------------|-------|
| Airtable automations require manual setup | High | 2025-12-29 | Cannot be automated - Matt must enable per client |
| Worker only does COA linking | Medium | 2025-12-29 | By design - not a bug |
| No automation status visibility | Medium | 2025-12-29 | Cannot verify if client automation is enabled |
| System-wide sync gap | High | 2025-12-29 | Most entities show synced: 0 |

### Resolved Issues

| Issue | Resolution | Date |
|-------|------------|------|
| - | - | - |

---

## Session Feedback

### Session 1 (2025-12-29) - Creation Session
**Context:** Created skill based on Blackhawk Logistics debugging
**Outcome:** Skill created, untested
**Feedback:** Pending - skill just created

---

## Learnings

1. **`airtable_base_id` NULL is the most common failure** - Always check this first
2. **`synced: 0` is normal** - The worker does COA linking, not record creation
3. **Airtable automations are the actual sync mechanism** - This is outside our control
4. **Wrong Supabase project is easy mistake** - Always verify project ID `lrwvooucggciazmzxqlb`

---

## Future Improvements

- [ ] Add Airtable MCP integration to verify base accessibility
- [ ] Create script to check sync status across all entities
- [ ] Document how to enable Airtable automations (get from Matt)
- [ ] Add diagnostic mode to troubleshoot existing entities
