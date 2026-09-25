# 13: Scholarly Works State Persistence Bugfix

**What to build:** Fix state volatility and accidental data wipes in the Scholarly Works Portfolio. Ensure that adding new citations/entries, switching tabs, or re-rendering forms preserves all entered fields in local storage / application state with idempotent record creation.

**Blocked by:** None (can start immediately)

**Status:** pending

- [ ] Form state preservation: Ensure draft entry inputs do not get cleared when new entries are appended or validated.
- [ ] Local storage sync & rehydration: Back student scholarly works records (peer-reviewed articles, abstracts, presentations, collections) with browser local storage cache so refreshes and tab switches preserve draft content.
- [ ] Idempotent record creation: Prevent duplicate keys or lost entries during list mutations.
- [ ] Regression tests ensuring full test coverage for addition, editing, deletion, and rehydration of scholarly entries.
