# 14: Universal Residency Program Database Integration & Row-Based Matrix

**What to build:** Ingest the residency programs dataset/PDFs across specialties (including program director contact info, location, city, state, census region, setting, and specialty metadata) into an easily searchable, typed dataset. Redesign the School List Matrix from the card/kanban columns into a sortable, row-based table layout categorized by Reach, Target, Safety, and Region with full-text search and filtering.

**Blocked by:** None (can start immediately)

**Status:** pending

- [ ] Data ingestion: Ingest and parse residency program records from project PDF/dataset context (`Context/Residency Programs/`) with contact, city, state, region, and specialty fields.
- [ ] Row-based table architecture: Replace or augment card view with a compact, sortable, and filterable table displaying Program Name, Specialty, Tier (Reach, Target, Safety), Region, Signals assigned, and Status.
- [ ] Full-text search and faceted filters: Multi-select filtering by Specialty, Region (Northeast, South, Midwest, West), and Tier, plus instant text search for program names and cities.
- [ ] Program details drawer / modal: Expandable details view with Program Director name, website link, and verified training statistics.
- [ ] Comprehensive tests for searching, sorting, tiering, and signal assignments across the new row-based matrix.
