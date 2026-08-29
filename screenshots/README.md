# Screenshots

Evidence referenced from [`../BUG_REPORT.md`](../BUG_REPORT.md).

| File | Shows |
| --- | --- |
| `BUG-001-edit-before.png` | The inventory with a single Python Cookbook at Stock: 40 |
| `BUG-001-edit-modal.png` | The Edit modal opened on that product, pre-filled with Stock: 40 |
| `BUG-001-edit-after.png` | After saving: two Python Cookbook cards, Stock: 40 and Stock: 30 |
| `BUG-002-delete-confirm.png` | The confirmation dialog shown on clicking Delete |
| `BUG-002-delete-after-confirm.png` | The list immediately after confirming — unchanged |
| `BUG-002-delete-after-refresh.png` | The list after a page refresh — still unchanged |

Failure evidence for the automated tests is generated separately by Playwright into
`test-results/` and linked from the HTML report, so it is not duplicated here.
