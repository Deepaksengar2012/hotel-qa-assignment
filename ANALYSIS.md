# Part 1a — Test Design

## Task A: 20 Test Scenarios

### Boundary Cases (6)

**B1. Distance exactly at 5.000 km**
- Preconditions: Selected hotel at fixed coordinates. Candidate hotel priced cheaper and scored better, distance computed as exactly 5.000 km.
- Steps: Request recommendations for selected hotel.
- Expected: Clarify with product (see Q5), but per the stated rule "within 5 km," 5.000 km should be **included** (inclusive boundary). Verify system's actual behavior matches the agreed definition, and that it's applied consistently.

**B2. Distance at 5.01 km (just outside)**
- Preconditions: Same as B1 but distance = 5.01 km, all other criteria pass.
- Steps: Request recommendations.
- Expected: Candidate is excluded from results.

**B3. candidate_total_price exactly equal to selected_total_price**
- Preconditions: Candidate price = selected price exactly (e.g., both ₹21,000).
- Steps: Request recommendations.
- Expected: Candidate fails "cheaper" rule (`<`, not `<=`) and is excluded, even if score is higher.

**B4. candidate_score exactly equal to selected_score**
- Preconditions: Candidate's computed Score equals selected Score exactly (e.g., matched review_score, star_rating, amenity_match_percent).
- Steps: Request recommendations.
- Expected: Candidate fails "better" rule (`>`, not `>=`) and is excluded.

**B5. Exactly 10 valid candidates available**
- Preconditions: Exactly 10 hotels satisfy all 4 inclusion rules.
- Steps: Request recommendations.
- Expected: All 10 are returned, fully ranked, no padding/backfill needed.

**B6. Fewer than 10 valid candidates available (e.g., 3)**
- Preconditions: Only 3 hotels satisfy all inclusion rules; others fail one or more rules.
- Steps: Request recommendations.
- Expected: Exactly 3 results returned. System must **not** pad the list with hotels that fail exclusion rules (e.g., the selected hotel itself, sold-out hotels) just to reach 10.

### Negative Cases (6)

**N1. Candidate more expensive than selected**
- Preconditions: Candidate total_price > selected total_price, better score, valid distance/inventory.
- Steps: Request recommendations.
- Expected: Candidate excluded — fails "cheaper" rule regardless of quality.

**N2. Candidate has lower/equal score than selected**
- Preconditions: Candidate cheaper, but Score ≤ selected Score.
- Steps: Request recommendations.
- Expected: Candidate excluded — fails "better" rule.

**N3. Candidate hotel is inactive**
- Preconditions: Candidate flagged `active = false`, otherwise qualifies on price/score/distance/inventory.
- Steps: Request recommendations.
- Expected: Candidate excluded regardless of how well it scores.

**N4. Candidate is sold out (inventory_available = 0)**
- Preconditions: Candidate qualifies on all other rules but `inventory_available = 0` for the selected stay dates.
- Steps: Request recommendations.
- Expected: Candidate excluded.

**N5. Candidate is the same hotel as selected**
- Preconditions: Same hotel_id as selected hotel appears in the raw candidate pool (e.g., due to a data join bug).
- Steps: Request recommendations.
- Expected: Selected hotel itself never appears in its own recommendation list, even at 0 km / matching price.

**N6. Candidate outside locality/radius constraint**
- Preconditions: Candidate is cheaper and better, but is in a different locality and > 5 km away.
- Steps: Request recommendations.
- Expected: Candidate excluded — fails "comparable location" rule.

### Ranking / Sorting Correctness (4)

**R1. Primary sort by ScoreDelta descending**
- Preconditions: Three valid candidates with distinct ScoreDelta values (e.g., +1.2, +0.5, +0.1), all other tie-break fields varied arbitrarily.
- Steps: Request recommendations.
- Expected: Order strictly follows descending ScoreDelta, independent of price/distance/review_count values.

**R2. Tie on ScoreDelta → sort by lowest total_price**
- Preconditions: Two candidates with identical ScoreDelta, different total_price.
- Steps: Request recommendations.
- Expected: Lower total_price candidate ranks first.

**R3. Tie on ScoreDelta and price → sort by lowest distance_km**
- Preconditions: Two candidates, identical ScoreDelta and total_price, different distance_km.
- Steps: Request recommendations.
- Expected: Closer candidate (lower distance_km) ranks first.

**R4. Tie on ScoreDelta, price, and distance → sort by highest review_count**
- Preconditions: Two candidates identical on ScoreDelta, total_price, and distance_km; different review_count.
- Steps: Request recommendations.
- Expected: Higher review_count candidate ranks first. Also verify a fully-tied pair (all 4 keys equal) produces a stable, deterministic order across repeated requests (see Clarifying Question 1).

### Data Correctness (4)

**D1. Total price math consistency**
- Preconditions: Candidate has nightly_price = X and a known number of nights N for the stay.
- Steps: Request recommendations; inspect displayed total_price and nightly_price.
- Expected: `total_price == nightly_price × nights` (plus any disclosed taxes/fees per Q2/Q8-equivalent policy); no silent rounding drift between nightly and total figures.

**D2. Currency consistency across candidate set**
- Preconditions: Selected hotel priced in INR; one candidate's raw data is stored in USD.
- Steps: Request recommendations.
- Expected: All prices are normalized to a single currency (selected hotel's currency or user's display currency) before any price comparison or ranking; the UI never mixes currency symbols within one result set.

**D3. Stale inventory / rate handling**
- Preconditions: Candidate's price/inventory record was last refreshed beyond the agreed staleness threshold (e.g., > 30 minutes old, per Q3).
- Steps: Request recommendations.
- Expected: Stale candidate is either refreshed before comparison, excluded, or clearly flagged as unconfirmed — not silently shown as a firm price.

**D4. Missing amenity_match_percent / review_score**
- Preconditions: Candidate record has a null or missing amenity_match_percent (or review_score).
- Steps: Request recommendations.
- Expected: System handles the missing field per an agreed default/exclusion policy (see Q4) rather than crashing, showing `NaN`, or silently treating null as 0 without disclosure.

---

## Task B: 8 Clarifying Questions

1. When ScoreDelta, total_price, distance_km, and review_count are **all** tied, what is the final deterministic tiebreaker (e.g., hotel_id, alphabetical name, most recently onboarded)? Without one, result order may not be stable across identical requests.
2. How should currency differences between the selected hotel and candidates be handled — convert everything to one reference currency, and if so, using what exchange rate source and refresh frequency?
3. What is the maximum allowed age ("staleness threshold") for a price/inventory record before it must be excluded or re-fetched rather than shown as-is?
4. If `review_score` or `amenity_match_percent` is missing/null for a candidate, should that candidate be excluded from scoring entirely, given a default value, or treated as an automatic fail on the "better" rule?
5. Is the 5 km distance boundary inclusive or exclusive — does a candidate at exactly 5.000 km qualify?
6. Are "cheaper" and "better" both mandatory (AND) for a hotel to qualify as a recommendation, or is meeting either condition sufficient (OR)?
7. If fewer than 10 valid candidates exist after applying all filters, should the system return fewer than 10, backfill with the next-best hotels that fail one soft rule, or display a "limited results" message?
8. Is "same locality" a separate, authoritative field (e.g., a locality/neighborhood ID) that can override the 5 km radius, or is 5 km always the effective rule regardless of locality tagging — and if locality is authoritative, what dataset defines locality boundaries?

---

# Part 1b — Bugs Found in the Sample Recommendation Table

**Selected: Skyline Business Hotel — Total ₹21,000 — 4★ — 8.3 (1,240)**

1. **Selected hotel recommends itself (Rank 10).** Skyline Business Hotel appears in its own recommendation list at 0.0 km with the tag "Selected hotel." This directly violates the exclusion rule "Exclude: Same hotel as selected."

2. **Duplicate listing (Rank 1 and Rank 9).** "Orbit Executive Stay" appears twice with identical data (2.1 km, ₹19,800, 4★, 8.9 (980)). A duplicate should never occupy a second slot in a top-10 list — this wastes a recommendation slot and inflates the appearance of result diversity.

3. **Distance exceeds the 5 km limit (Rank 3).** "Comet Residency" is 5.8 km away, which fails the "comparable location" rule (assume within 5 km). It should be excluded, not ranked #3.

4. **Impossible review score (Rank 4).** "Nexus Park Hotel" shows a review score of 10.8, which is out of range for any standard 0–10 (or 0–5) review scale. This is corrupted/invalid data and cannot be used to compute a valid Score — the hotel shouldn't be rankable until the underlying data is fixed.

5. **Candidate is not actually cheaper, but tagged "Cheaper" (Rank 5).** "Zenith Inn" is priced at ₹22,400, which is *higher* than the selected hotel's ₹21,000. This fails `candidate_total_price < selected_total_price` and should be excluded entirely, not merely mislabeled.

6. **Currency mismatch (Rank 6).** "Vertex Corporate Rooms" is priced in **$18,900 (USD)** while every other row uses ₹ (INR). Without currency normalization, this price cannot be validly compared to the selected hotel's ₹21,000 — the ranking engine appears to be comparing raw numbers across currencies, which is a serious data-correctness bug.

7. **Candidate fails the "better" rule but is included (Rank 7).** "Aurora Budget Plus" is 3★ vs. the selected hotel's 4★, with a review score (8.9) only marginally higher than selected (8.3). Using the stated formula (ignoring the unlisted amenity term), its approximate score ties or falls below the selected hotel's score — it does not clearly satisfy `candidate_score > selected_score`. At minimum, the "Better" computation isn't verifiable from the data shown and needs re-validation.

8. **Ranking order does not follow the specified sort rules.** Using the approximate scores computable from the visible fields, "Nexus Park Hotel" would have the largest ScoreDelta (even setting aside its invalid review score) yet is ranked #4, not #1. "Cobalt Stay" has a higher approximate ScoreDelta than "Zenith Inn," "Vertex Corporate Rooms," and "Aurora Budget Plus," yet is ranked last (#8) among legitimate candidates. The displayed order does not match "highest ScoreDelta → lowest total_price → lowest distance_km → highest review_count" under any consistent interpretation.

9. **Missing required UI field.** The product brief requires the UI to show **nightly price** per hotel; the table only shows **Total** price. Nightly price is missing entirely, and there's no visible amenity_match_percent data either, which also makes the "Better" score impossible for QA to independently verify.

10. **Net effect — insufficient valid candidates padded with invalid ones.** After correctly excluding the self-listing (#10), the duplicate (#9), the too-far hotel (#3), the not-actually-cheaper hotel (#5), and hotels with unverifiable/invalid scores (#4, #7) and unresolved currency (#6), only a small number of genuinely valid, rankable candidates remain (Orbit, Metro Suites, Cobalt Stay, at minimum). The system returned 10 rows without disclosing that several of them shouldn't qualify — it should either return fewer results or the underlying data/logic bugs above should be fixed first.
