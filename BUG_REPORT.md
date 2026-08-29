# Bug Report — Product Inventory Application

**Application:** https://qa-takehome-app.onrender.com/index.html
**Date tested:** 28 August 2026
**Environment:** macOS (Apple silicon) · Google Chrome 151
**Account:** `admin@test.com` (administrator)
**Method:** 30 minutes of session-based exploratory testing (see
[`docs/exploratory-testing-notes.md`](./docs/exploratory-testing-notes.md))

---

## Summary

| ID | Title | Area | Severity | Priority |
| --- | --- | --- | --- | --- |
| BUG-001 | Saving an edit creates a duplicate product instead of updating the original | Edit product | Critical | P1 |
| BUG-002 | Confirming a delete has no effect — products cannot be removed | Delete product | Critical | P1 |

### Prioritisation rationale

Both defects are P1 because between them the inventory has become **append-only**: records can be
created, but not corrected and not removed. Every mistake a user makes is permanent, and every
attempted correction adds a second wrong record rather than fixing the first. For an inventory
application that is a loss of the core function, not a degradation of it.

BUG-001 is listed first because it is the more damaging of the two: it fails *silently*. The user
sees their change appear on screen and reasonably concludes it saved, while the original record sits
unchanged further down the list. BUG-002 is at least observable — the product visibly stays put —
though the confirmation prompt makes it misleading in its own way, since the user consents to a
destructive action that never happens.

### Suspected shared root cause

The two defects are consistent with a single underlying flaw: **products are matched by name (or by
array index) rather than by a stable unique id.** That would explain both symptoms — an update that
cannot locate its target row falls through to an insert, and a delete that cannot locate its target
row silently removes nothing. Worth checking first, since one fix may resolve both.

---

## BUG-001 — Saving an edit creates a duplicate product instead of updating the original

**Severity:** Critical  **Priority:** P1  **Area:** Dashboard → Edit Product

**Summary**
Submitting the Edit Product form does not modify the product being edited. Instead a second,
separate product is added to the inventory carrying the edited values, while the original record
remains in the list unchanged.

**Preconditions**
Logged in as `admin@test.com`, on the Product Inventory dashboard with the seeded products present.

**Steps to reproduce**
1. Scroll to the **Python Cookbook** card and note its values: `$44.99`, category `Books`,
   `Stock: 40`. It is the only Python Cookbook in the inventory.
2. Click **Edit** on that card. The Edit Product modal opens, pre-filled with the correct values.
3. Change **Stock** from `40` to `30`. Leave every other field untouched.
4. Click **Save**.

**Expected result**
The modal closes and the existing Python Cookbook card shows `Stock: 30`. The inventory still
contains exactly one Python Cookbook.

**Actual result**
The inventory now contains **two** Python Cookbook cards — the original at `Stock: 40` and a new one
at `Stock: 30`. Both show the same name, description and price (`$44.99`, `Books`). The edit was
applied to a newly created record rather than to the one that was opened.

**Impact**
No product can be corrected. Every edit inflates the catalogue with a near-identical duplicate and
leaves the stale record in place, so the inventory diverges further from reality with each attempted
fix. Because the edited values *do* appear on screen, the user has no signal that anything is wrong
and will not go looking for the stale copy. Combined with BUG-002 the duplicates cannot be cleaned
up afterwards.

**Evidence**
`screenshots/BUG-001-edit-before.png` — one Python Cookbook in the inventory, Stock: 40
`screenshots/BUG-001-edit-modal.png` — the Edit modal opened on that product, pre-filled with Stock: 40
`screenshots/BUG-001-edit-after.png` — after saving: two Python Cookbook cards, Stock: 40 and Stock: 30

**Notes**
Reproduced on the first attempt. See the suspected shared root cause above. Worth checking whether
editing the **name** field behaves the same way, and whether a page refresh changes what is
displayed.

---

## BUG-002 — Confirming a delete has no effect; products cannot be removed from the inventory

**Severity:** Critical  **Priority:** P1  **Area:** Dashboard → Delete Product

**Summary**
Deleting a product prompts for confirmation as expected, but confirming does nothing. The product
remains in the inventory, no success or error message is shown, and the record survives a page
refresh.

**Preconditions**
Logged in as `admin@test.com`, with at least one product in the inventory.

**Steps to reproduce**
1. Locate any product card — reproduced on **Table Lamp**, on **AC** (a product created through Add
   Product during this session), and on both **Python Cookbook** duplicates.
2. Click **Delete** on that card.
3. A browser confirmation dialog appears: *"Are you sure you want to delete this product?"* Click
   **OK**.
4. Refresh the page.

**Expected result**
The product is removed from the inventory and the list re-renders without it.

**Actual result**
The dialog closes and nothing else happens. The card is still in the list, and no success or error
message is shown anywhere on the page. **The product is still present after a full page refresh**,
so the record was never removed — this is not a stale-render problem. The behaviour is identical for
seeded products and for products created during the session.

**Impact**
Products cannot be removed from the inventory. Bad records — including the duplicates generated by
BUG-001 and any product added in error — are permanent. The failure is particularly misleading
because the confirmation step implies the action is being taken: the user explicitly consents to a
destructive operation and receives no indication that it did not occur.

**Evidence**
`screenshots/BUG-002-delete-confirm.png` — the confirmation dialog on clicking Delete
`screenshots/BUG-002-delete-after-confirm.png` — the list immediately after confirming, unchanged
`screenshots/BUG-002-delete-after-refresh.png` — the list after a page refresh, still unchanged

**Notes**
Affects every product tested, both seeded and newly created, so it is not specific to the duplicated
records. The confirmation dialog fires, which places the failure after the click handler and its
`confirm()` call rather than in the wiring of the button. A page refresh rules out a stale-render
fault. The next diagnostic step is the console and network tab on confirming — whether the handler
throws after the dialog resolves, or a request is sent and the record is never matched.

---

## Observations (not raised as defects)

Noted during the session but below the bar for a defect report:

- **The Edit Product modal has no Cancel button**, only an `×` in the corner. Users expect an
  explicit Cancel alongside Save, particularly on a form that mutates data.
- **The Description field renders in a monospace font** while Name, Price and Stock use the body
  font. Cosmetic inconsistency in the same form.
- **No product count is displayed on the dashboard.** With no total, duplicate records like those in
  BUG-001 are easy to miss — a count would have surfaced the problem immediately.
- **The delete confirmation is a native browser `confirm()` dialog.** It does the job, but it cannot
  name the product being deleted, so on a list containing duplicates the user cannot tell which
  record they are confirming. An in-app dialog naming the product would be safer.

## Recommended for the next session

Not covered in this time-box, and worth testing before release:

- Search behaviour — case sensitivity, partial matches, empty state, special characters.
- Whether the category filter composes with an active search term.
- Add Product validation — required fields, negative and non-numeric prices, duplicate names.
- Whether the dashboard is reachable directly without an authenticated session.
- Accessibility and responsive layouts.
