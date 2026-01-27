#!/usr/bin/env node

/**
 * SDD Batch Scheduler
 *
 * Analyzes tasks for a milestone and generates an execution plan:
 * - Builds dependency graph (DAG)
 * - Determines topological order
 * - Identifies safe parallel execution sets (max 2 concurrent)
 * - Applies conservative rules: only parallelize if tasks are in different workspaces
 *   and don't touch "global lock" paths (spec/**, README.md, .github/**, .sdd/**, .cursor/**, lockfiles)
 */

const fs = require('fs');
const path = require('path');

// Global lock paths (tasks touching these must run sequentially)
const GLOBAL_LOCK_PATHS = [
  'spec/**',
  'README.md',
  '.github/**',
  '.sdd/**',
  '.cursor/**',
  'package.json',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'env.example',
  'work/backlog/**',
];

// Max concurrent tasks
const MAX_CONCURRENT = 2;

function parseTasks(tasksFile) {
  const content = fs.readFileSync(tasksFile, 'utf-8');
  const tasks = {};
  let currentTask = null;

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Task header: ## Task: tX.Y
    const taskMatch = line.match(/^## Task:\s+(.+)$/);
    if (taskMatch) {
      if (currentTask) {
        tasks[currentTask.id] = currentTask;
      }
      currentTask = {
        id: taskMatch[1].trim(),
        description: '',
        workspace: null,
        milestone: null,
        dependencies: [],
        status: null,
        tags: [],
      };
      continue;
    }

    if (!currentTask) continue;

    // Description
    if (line.startsWith('**Description:**')) {
      currentTask.description = line.replace('**Description:**', '').trim();
      continue;
    }

    // Workspace
    if (line.startsWith('**Workspace:**')) {
      currentTask.workspace = line.replace('**Workspace:**', '').trim();
      continue;
    }

    // Milestone
    if (line.startsWith('**Milestone:**')) {
      currentTask.milestone = line.replace('**Milestone:**', '').trim();
      continue;
    }

    // Dependencies
    if (line.startsWith('**Dependencies:**')) {
      const depsLine = line.replace('**Dependencies:**', '').trim();
      if (depsLine && depsLine !== 'none') {
        currentTask.dependencies = depsLine
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean);
      }
      continue;
    }

    // Status
    if (line.startsWith('**Status:**')) {
      currentTask.status = line.replace('**Status:**', '').trim();
      continue;
    }

    // Tags
    if (line.startsWith('**Tags:**')) {
      const tagsLine = line.replace('**Tags:**', '').trim();
      if (tagsLine) {
        currentTask.tags = tagsLine.split(',').map((t) => t.trim());
      }
      continue;
    }
  }

  if (currentTask) {
    tasks[currentTask.id] = currentTask;
  }

  return tasks;
}

function getMilestoneTasks(milestonesFile, milestoneId) {
  const content = fs.readFileSync(milestonesFile, 'utf-8');
  const lines = content.split('\n');
  const taskIds = [];
  let inMilestone = false;

  for (const line of lines) {
    // Milestone header: ## M2 — ...
    if (line.match(new RegExp(`^## ${milestoneId}\\s`))) {
      inMilestone = true;
      continue;
    }

    // Next milestone starts
    if (inMilestone && line.match(/^## M\d+\s/)) {
      break;
    }

    // Task reference in milestone (optional, but we'll also check tasks.local.md)
    if (inMilestone && line.includes('t')) {
      const taskMatch = line.match(/t\d+\.\d+/g);
      if (taskMatch) {
        taskIds.push(...taskMatch);
      }
    }
  }

  return taskIds;
}

function buildDAG(tasks, taskIds) {
  const graph = {};
  const inDegree = {};

  // Initialize
  for (const taskId of taskIds) {
    if (!tasks[taskId]) continue;
    graph[taskId] = [];
    inDegree[taskId] = 0;
  }

  // Build edges
  for (const taskId of taskIds) {
    const task = tasks[taskId];
    if (!task || !task.dependencies) continue;

    for (const dep of task.dependencies) {
      if (taskIds.includes(dep) && tasks[dep]) {
        graph[dep].push(taskId);
        inDegree[taskId] = (inDegree[taskId] || 0) + 1;
      }
    }
  }

  return { graph, inDegree };
}

function topologicalSort(graph, inDegree) {
  const queue = [];
  const result = [];

  // Find all nodes with no incoming edges
  for (const node in inDegree) {
    if (inDegree[node] === 0) {
      queue.push(node);
    }
  }

  while (queue.length > 0) {
    const node = queue.shift();
    result.push(node);

    // Process neighbors
    for (const neighbor of graph[node] || []) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  return result;
}

function touchesGlobalLock(task) {
  // Heuristic: if task description mentions global paths or task has no workspace (root-level)
  if (!task.workspace || task.workspace === '.') {
    return true;
  }

  const desc = (task.description || '').toLowerCase();
  const globalKeywords = ['spec', 'readme', 'github', 'infrastructure', 'documentation', 'config'];
  return globalKeywords.some((keyword) => desc.includes(keyword));
}

function canRunParallel(task1, task2) {
  // Must have different workspaces
  if (!task1.workspace || !task2.workspace) {
    return false;
  }
  if (task1.workspace === task2.workspace) {
    return false;
  }

  // Neither can touch global lock paths
  if (touchesGlobalLock(task1) || touchesGlobalLock(task2)) {
    return false;
  }

  return true;
}

function createParallelBatches(tasks, sortedTaskIds, maxConcurrent) {
  const batches = [];
  const remaining = [...sortedTaskIds];
  const completed = new Set();

  while (remaining.length > 0 || completed.size < sortedTaskIds.length) {
    const batch = [];
    const batchTaskIds = [];

    // Find tasks ready to run (dependencies satisfied)
    for (const taskId of remaining) {
      if (completed.has(taskId)) continue;

      const task = tasks[taskId];
      if (!task) continue;

      // Check if all dependencies are completed
      const depsSatisfied = !task.dependencies || task.dependencies.every((dep) => completed.has(dep));

      if (!depsSatisfied) continue;

      // Try to add to batch (respecting max concurrent and parallel rules)
      if (batch.length === 0) {
        batch.push(task);
        batchTaskIds.push(taskId);
      } else if (batch.length < maxConcurrent) {
        // Check if can run parallel with existing tasks in batch
        const canParallel = batch.every((existingTask) => canRunParallel(existingTask, task));
        if (canParallel) {
          batch.push(task);
          batchTaskIds.push(taskId);
        }
      }
    }

    if (batch.length === 0) {
      // No tasks ready, but we have remaining - this shouldn't happen if DAG is correct
      // Fallback: take first remaining task
      const taskId = remaining[0];
      const task = tasks[taskId];
      if (task) {
        batch.push(task);
        batchTaskIds.push(taskId);
      } else {
        break;
      }
    }

    batches.push({
      tasks: batch,
      taskIds: batchTaskIds,
      reason:
        batch.length === 1
          ? `Sequential: ${batch[0].workspace || 'root'} workspace or touches global lock paths`
          : `Parallel: ${batch.map((t) => t.workspace).join(' + ')} workspaces (disjoint)`,
    });

    // Mark as completed
    for (const taskId of batchTaskIds) {
      completed.add(taskId);
      const index = remaining.indexOf(taskId);
      if (index > -1) {
        remaining.splice(index, 1);
      }
    }
  }

  return batches;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node sdd-scheduler.cjs <milestone-id>');
    console.error('Example: node sdd-scheduler.cjs M2');
    process.exit(1);
  }

  const milestoneId = args[0];
  const repoRoot = path.resolve(__dirname, '../..');
  const tasksFile = path.join(repoRoot, 'work/backlog/tasks.local.md');
  const milestonesFile = path.join(repoRoot, 'work/backlog/milestones.md');

  if (!fs.existsSync(tasksFile)) {
    console.error(`Tasks file not found: ${tasksFile}`);
    process.exit(1);
  }

  if (!fs.existsSync(milestonesFile)) {
    console.error(`Milestones file not found: ${milestonesFile}`);
    process.exit(1);
  }

  // Parse tasks
  const allTasks = parseTasks(tasksFile);

  // Get milestone tasks (filter by milestone field in tasks)
  const milestoneTasks = Object.values(allTasks).filter(
    (task) => task.milestone === milestoneId && task.status !== 'done'
  );

  if (milestoneTasks.length === 0) {
    console.error(`No tasks found for milestone ${milestoneId}`);
    process.exit(1);
  }

  const taskIds = milestoneTasks.map((t) => t.id);

  // Build DAG
  const { graph, inDegree } = buildDAG(allTasks, taskIds);

  // Topological sort
  const sortedTaskIds = topologicalSort(graph, inDegree);

  // Create parallel batches
  const batches = createParallelBatches(allTasks, sortedTaskIds, MAX_CONCURRENT);

  // Output JSON plan
  const plan = {
    milestone: milestoneId,
    totalTasks: taskIds.length,
    maxConcurrent: MAX_CONCURRENT,
    executionOrder: sortedTaskIds,
    batches: batches.map((batch) => ({
      taskIds: batch.taskIds,
      workspaces: batch.tasks.map((t) => t.workspace || 'root'),
      reason: batch.reason,
      canRunParallel: batch.tasks.length > 1,
    })),
  };

  console.log(JSON.stringify(plan, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = { parseTasks, buildDAG, topologicalSort, createParallelBatches };
