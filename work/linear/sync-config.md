# Linear sync config (Guapo)
#
# Purpose:
# - Enable SDD commands to sync status/comments to Linear via MCP.
# - Define a safe "Cloud Agent pilot" label that can be used to delegate small, isolated tasks to Cursor Cloud Agents.
#
# NOTE:
# - This file is intended for the `staging` branch (development workflow).
# - Do not store secrets here.
#

MODE=linear

# Team to operate on in Linear
TEAM_NAME=Guapo

# Status mapping (names must match your Linear workflow statuses)
STATUS_TODO=Todo
STATUS_IN_PROGRESS=In Progress
STATUS_BLOCKED=Blocked
STATUS_DONE=Done

# Cloud Agent pilot (Cursor Cloud Agents)
#
# Only apply this label to tasks that are:
# - Small and isolated
# - Explicitly scoped (Scope + Out of scope + Acceptance)
# - Safe to run without architectural decisions
#
CLOUD_AGENT_LABEL=agent-ok

# Defaults for automation behavior
AUTO_CREATE_DOCUMENTS=false
AUTO_ASSIGN_CURSOR_AGENT=false
