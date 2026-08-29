# Exploratory Testing — Session Notes

**Application:** https://qa-takehome-app.onrender.com/index.html
**Tester:** Nirav
**Date:** 28 August 2026
**Environment:** macOS (Apple silicon) · Google Chrome 151
**Time-boxed to:** 30 minutes

## Approach

Session-based exploratory testing, prioritised by risk. Authentication came first because it gates
everything else, then the write paths — add, edit, delete — because that is where damage is
permanent and where a defect costs the most to recover from.

The write paths turned out to be where the application breaks, so the remaining time went into
characterising those two failures properly rather than spreading thinly across the read paths.
Search and filtering are therefore listed as not covered, with an explicit note rather than an
assumed pass.

Findings are written up in [`BUG_REPORT.md`](../BUG_REPORT.md).

---

## Charter 1 — Authentication

*Explore the login screen to establish whether access control works before testing anything behind
it.*

| # | Check | Result |
| --- | --- | --- |
| 1.1 | Valid credentials reach the Product Inventory dashboard | Pass |
| 1.2 | The dashboard renders with the seeded products, search, filter and Add Product | Pass |

Checks 1.1 and the dashboard content assertions are automated in `tests/login.spec.ts`, along with a
negative test confirming that invalid credentials do not grant access.

---

## Charter 2 — Editing a product

*Explore the Edit Product flow to discover whether changes are applied to the correct record.*

| # | Check | Result |
| --- | --- | --- |
| 2.1 | Edit opens a modal pre-filled with the selected product's values | Pass |
| 2.2 | The modal exposes Name, Description, Price, Category and Stock | Pass |
| 2.3 | Changing Stock and saving updates the existing product | **Fail — BUG-001** |
| 2.4 | The inventory contains no duplicate after saving | **Fail — BUG-001** |
| 2.5 | The modal offers a way to cancel without saving | Only an `×`, no Cancel — see observations |
| 2.6 | The original record is left unmodified after saving | **Fail — BUG-001** (untouched at Stock: 40) |

Reproduced on **Python Cookbook**: Stock changed from 40 to 30, saved, and the inventory then held
two Python Cookbook cards — the original at Stock: 40 and a new one at Stock: 30.

---

## Charter 3 — Adding a product

*Explore Add Product to confirm new records reach the inventory.*

| # | Check | Result |
| --- | --- | --- |
| 3.1 | A valid product can be created and appears in the inventory | Pass |

Created **AC** — `$125.00`, category `Electronics`, `Stock: 29`. It rendered correctly in the list.
This product was then used as a clean, known-good record for the delete checks below.

---

## Charter 4 — Deleting a product

*Explore Delete to discover whether records can be removed, and whether the destructive action is
guarded.*

| # | Check | Result |
| --- | --- | --- |
| 4.1 | Delete asks the user to confirm before acting | Pass — native `confirm()` dialog |
| 4.2 | Confirming removes a seeded product (Table Lamp) | **Fail — BUG-002** |
| 4.3 | Confirming removes a product created this session (AC) | **Fail — BUG-002** |
| 4.4 | Confirming removes one of the duplicated Python Cookbook records | **Fail — BUG-002** |
| 4.5 | Some feedback is shown on success or failure | **Fail — BUG-002** (silent) |
| 4.6 | The product is gone after a page refresh | **Fail — BUG-002** (still present) |

The confirmation step works — the dialog fires on every click — but confirming it removes nothing.
Checks 4.3 and 4.4 were run deliberately to rule out two narrower hypotheses: that the failure was
specific to the seeded data, and that it was caused by the duplicate names introduced by BUG-001.
Neither holds. Check 4.6 rules out a third: the product survives a full page refresh, so this is a
failure of the delete operation and not a stale list rendering. Taken together, the failure sits
after the click handler and its `confirm()` call, not in the wiring of the button.

---

## Cross-charter analysis

BUG-001 and BUG-002 are consistent with one underlying flaw: products being matched by name or array
index rather than by a stable unique id. An update that cannot resolve its target row falling
through to an insert, and a delete that cannot resolve its target row removing nothing, are the two
symptoms that flaw would produce. Recommended as the first thing to check, since a single fix may
close both defects.

The combined effect is worth stating plainly: the inventory is currently **append-only**. Records
can be added, but not corrected and not removed.

---

## Not covered in this session

Stated explicitly so the gaps are known rather than assumed:

- **Search** — case sensitivity, partial matching, empty state, special characters. Partially
  covered by the automated suite in `tests/search.spec.ts`.
- **Category filter** — in isolation and combined with an active search term.
- **Add Product validation** — required fields, negative and non-numeric prices, duplicate names.
- **Session handling** — whether the dashboard is reachable directly without logging in.
- **Accessibility** — keyboard-only navigation, screen reader labels, contrast.
- **Responsive and mobile layouts.**
- **Console and network behaviour** — BUG-002 was characterised through the UI only. The browser
  console and network tab would show whether the delete handler throws before firing or whether a
  request is sent and the record simply never matched.
