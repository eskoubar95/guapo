---
helper_id: worktree-scheduler
load_when:
  - task_batch
  - parallel_execution_needed
sections:
  rules:
    title: "Scheduler Rules"
    lines: [1, 100]
  output_format:
    title: "Output Format"
    lines: [101, 200]
always_load: false
---

# Worktree Scheduler Helper

This helper defines rules and logic for determining when tasks can run in parallel vs sequentially during batch execution.

## Purpose

The scheduler analyzes tasks for a milestone and generates an execution plan that:
- Respects dependency order (DAG)
- Identifies safe parallel execution sets
- Applies conservative rules to avoid conflicts
- Uses git worktrees for isolation when parallelizing

## Scheduler Rules

### Global Lock Paths

Tasks that touch these paths **must run sequentially** (cannot be parallelized):

- `spec/**` - Specification files (source of truth)
- `README.md` - Project documentation
- `.github/**` - GitHub workflows and configs
- `.sdd/**` - SDD system configs (git-config.json, etc.)
- `.cursor/**` - Cursor rules and commands
- `package.json`, `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock` - Package manager files
- `env.example` - Environment variable inventory
- `work/backlog/**` - Task and milestone definitions

**Rationale:** These are shared resources that multiple tasks modifying simultaneously would cause conflicts or inconsistent state.

### Parallel Execution Rules

Two tasks can run in parallel **only if**:

1. **Different workspaces**: Tasks must have different `**Workspace:**` values (e.g., `apps/cms` vs `apps/commerce`)
2. **No global lock touch**: Neither task touches global lock paths (see above)
3. **Dependencies satisfied**: All dependencies of both tasks are completed
4. **Max concurrent limit**: Maximum 2 tasks can run in parallel (configurable)

### Sequential Execution Rules

Tasks must run sequentially if:

- They share the same workspace
- Either task touches global lock paths
- They have a dependency relationship (DAG edge)
- They are root-level tasks (`**Workspace:** .`)

### Dependency Graph (DAG)

The scheduler builds a dependency graph from task `**Dependencies:**` fields:

- Tasks with no dependencies can start immediately
- Tasks with dependencies wait until all dependencies are completed
- Topological sort determines execution order

## Scheduler Script

The scheduler is implemented as `.cursor/scripts/sdd-scheduler.cjs`:

**Usage:**
```bash
node .cursor/scripts/sdd-scheduler.cjs <milestone-id>
```

**Example:**
```bash
node .cursor/scripts/sdd-scheduler.cjs M2
```

**Output:** JSON plan with execution order and parallel batches.

## Output Format

The scheduler outputs a JSON plan:

```json
{
  "milestone": "M2",
  "totalTasks": 4,
  "maxConcurrent": 2,
  "executionOrder": ["t2.1", "t2.2", "t2.3", "t2.4"],
  "batches": [
    {
      "taskIds": ["t2.1"],
      "workspaces": ["apps/cms"],
      "reason": "Sequential: first task in dependency chain",
      "canRunParallel": false
    },
    {
      "taskIds": ["t2.2", "t2.3"],
      "workspaces": ["apps/cms", "apps/cms"],
      "reason": "Parallel: both depend on t2.1, different concerns",
      "canRunParallel": true
    },
    {
      "taskIds": ["t2.4"],
      "workspaces": ["apps/cms"],
      "reason": "Sequential: depends on t2.2",
      "canRunParallel": false
    }
  ]
}
```

### Plan Fields

- `milestone`: Milestone ID (e.g., "M2")
- `totalTasks`: Number of tasks in milestone
- `maxConcurrent`: Maximum concurrent tasks (default: 2)
- `executionOrder`: Topologically sorted task IDs
- `batches`: Array of execution batches
  - `taskIds`: Task IDs in this batch
  - `workspaces`: Workspace paths for each task
  - `reason`: Human-readable explanation
  - `canRunParallel`: Whether tasks in batch can run in parallel

## Worktree Execution

When tasks run in parallel, each task gets its own git worktree:

**Worktree structure:**
```
.sdd/worktrees/
  task-t2.1/
    [isolated working directory for t2.1]
  task-t2.2/
    [isolated working directory for t2.2]
```

**Benefits:**
- No working tree conflicts
- Independent build/install state
- Isolated git operations (commits, branches)
- Can run validation independently

**Cleanup:**
- Worktrees are removed after task completion
- Branches are merged to `staging` sequentially (not in parallel)

## Integration with `/task/batch`

The scheduler is invoked during `/task/batch` Step 0.5:

1. **Scheduler Phase**: Run `sdd-scheduler.cjs` to generate plan
2. **Plan Review**: Show user the execution plan (batches + reasons)
3. **Execution**: Execute batches using worktrees for parallel tasks
4. **Merge**: Sequentially merge completed tasks to `staging`

## Best Practices

1. **Review plan before execution**: Check that parallel sets make sense
2. **Respect dependencies**: Never skip dependency order
3. **Monitor conflicts**: If parallel tasks conflict, fall back to sequential
4. **Clean worktrees**: Ensure worktrees are cleaned up after batch

## Error Handling

If scheduler fails:
- Fall back to fully sequential execution
- Log error and continue with safe default
- Never block batch execution due to scheduler issues
