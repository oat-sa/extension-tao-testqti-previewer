# AGENTS.md — extension-tao-testqti-previewer (taoQtiTestPreviewer)

> Shared pillars (standards, quality / `pr-ready-gate`, Make, commit/PR):
> [nextgen-stack `tao/AGENTS.md`](https://github.com/oat-sa/nextgen-stack/blob/main/tao/AGENTS.md)
> · local: [`../AGENTS.md`](../AGENTS.md).

## 01 — Project Context

**What / why:** `oat-sa/extension-tao-testqti-previewer` (id `taoQtiTestPreviewer`)
provides **authoring preview** adapters for QTI items/tests: registry wiring +
thin FE previewer runner, plus backend session/outcome helpers.

Usually **no** main-menu chrome. **Not** the delivery/proctor test runner.

**Key directories / stack / constraints:**

```text
manifest.php
controller/Previewer.php, TestPreviewer.php
models/
scripts/install/         # RegisterPreviewers, …
views/js/previewer/
views/js/loader/qtiPreviewer.min.js
test/
```

- Stack: depends on items/tests/QTI/delivery; small FE, usually no
  `views/package.json`. Also used by some `taoMediaManager` preview flows.
- Versions from composer/CI.

**Docs:** [`README.md`](README.md). Shared docs / decision-log rules → parent AGENTS.

## 02 — Standards & Conventions

Package-only below. Family patterns, quality SoT, `pr-ready-gate`, polar-star →
**parent AGENTS**.

**Patterns / structure:**

- Discover via install/registry + DynamicModule; reuse runners via Require paths.

**Never do (this package):**

- Turn into a delivery runner; invent menu chrome; vendor engines.
- Hand-edit loaders; break registry module IDs.

**Ownership**

| Surface | Own? |
|---------|------|
| Authoring item/test preview adapters | **Yes** |
| Delivery / proctor runner | **No** |
| Library trees | **No** |

## 03 — Build & Test Commands

Shared Make / CI / readiness / commit policy → **parent AGENTS**
([commit/PR policy](https://oat-sa.atlassian.net/wiki/x/_oXmqQ)).

**This package** (from Composer platform root):

```bash
./vendor/bin/phpunit -c phpunit.xml.dist taoQtiTestPreviewer/test
npx grunt eslint:extensionreport --extension=taoQtiTestPreviewer --force
npx grunt taobundle --extension=taoQtiTestPreviewer
```
