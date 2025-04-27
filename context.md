# finlaysonstudio-model-evals context

A monorepo for evaluating LLM randomness and distributional behavior.

## Commands
- Build: `npm run build`
- Test all: `npm test`
- Test pattern: `npm test "pattern"`
- Test package: `npm test -w ./packages/models`
- Type check: `npm run typecheck`

## Guidelines
- Modern TypeScript best practices
- ESM modules (use import/export syntax)
- Vitest for testing (describe/it structure)
- Monorepo structure with workspace references

## Workflow

- plan.md describes the current project
- If the operator references a plan, task, or ticket, read this document to understand the request
- Each request must be limited to one task
- Operator will request _either_ a task be started or verified
- Newly started tasks should be marked as Dequeued
- Once complete newly started tasks should remain Dequeued
- Only Dequeued tasks can be verified in a separate request
- When requested, once verified, mark the task Verified
- Log a message any time a task is added to Queued, Dequeued, or Verified
- `echo "[Queued] Subject line of next task" >> .context.log`
- Log messages to a hidden file, `.context.log`
