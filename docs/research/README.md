# Research Notes

These are supporting notes for future quality work, not the main source of truth
for current package behavior.

Read them when you are evaluating new perturbation strategies, validating whether
to absorb an external paper, or deciding what should stay out of the core engine.

## Notes

- [robust-word-recognition.md](robust-word-recognition.md)
  ACL 2019 adversarial misspelling paper review. Main takeaway: borrow useful
  English typo constraints, do not import a correction model into the core.

- [multypo-eval.md](multypo-eval.md)
  Multilingual typo robustness paper review. Main takeaway: absorb weighting and
  sampling ideas selectively, while keeping `noisemake` deterministic and
  IME-centric for Chinese.

## How To Use These Notes

- Use them as input to implementation decisions.
- Do not treat them as settled product requirements.
- If a research conclusion becomes a real package decision, move that decision
  into [docs/core/plan.md](../core/plan.md) or the relevant implementation
  docs.
