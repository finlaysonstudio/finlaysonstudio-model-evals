#!/bin/bash
cat plan.md | claude \
"Given the provided plan, move the first queued task to dequeued. Complete that task. Leave the task in the dequeued state. Do not move it to verified."
