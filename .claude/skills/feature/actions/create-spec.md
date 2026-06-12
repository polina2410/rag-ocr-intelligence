# Create Spec Action

1. Check $ARGUMENTS (after "create-spec"):
   - If it references a step number or plan item (e.g. "step 5", "for step 5 in plan.md"): look up that step in `context/PLAN.md`
   - If it's a freeform feature description: use it directly
   - If empty: read `context/PLAN.md`, find the first step without a ✅ mark, and use that as the feature to spec

2. Derive the spec filename from the step number and title:
   - Format: `context/specs/step-{step-number}-{kebab-case-title}.md`
   - Examples: `step-5-shared-prettier-config.md`, `step-9-race-entity.md`
   - If there is no step number (freeform description), omit the `step-XX-` prefix

3. Spawn the `business-analyst` agent with this prompt:

   > Analyse the requirements for: {feature description}
   >
   > Context from `context/PLAN.md`: {paste the relevant plan item and any useful surrounding context — completed steps above it that affect current state}
   >
   > **Important:** Write your deliverable to `context/specs/{derived-filename}` (NOT current-feature.md).
   > Use the spec file format below instead of the current-feature.md format.
   >
   > Spec file format:
   > ```markdown
   > # Implementation Task: {Feature Name}
   >
   > ## What to build
   > {1–3 sentences}
   >
   > ## Current state
   > {Bullet list of relevant existing files, packages, versions}
   >
   > ## Deliverables (definition of done)
   > {Numbered list — each item is a concrete, verifiable output}
   >
   > ## Rules that must hold
   > {Hard constraints: conventions, security, backward-compat, etc.}
   >
   > ## Build steps
   > {Numbered, sequential implementation steps}
   >
   > ## Notes for the implementer
   > {Gotchas, edge cases, open questions}
   > ```
   >
   > Rules:
   > - No vague deliverables — every item must be checkable
   > - Spec what to build, not how to feel about it (no "clean", "elegant")
   > - Include current state so the implementer knows what they're replacing
   > - If any deliverable or build step is already fully implemented in the codebase, mark it with ✅
   > - Do not start implementation

4. The agent cannot write files — take its output and save it to the derived filename.

5. Confirm the spec was saved and show the deliverables list to the user.