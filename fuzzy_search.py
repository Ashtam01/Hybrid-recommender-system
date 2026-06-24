import pandas as pd
from rapidfuzz import fuzz, process


# ── Tuning knobs ──────────────────────────────────────────────────────
# Minimum score for a song‑name candidate to enter the shortlist
SONG_NAME_CUTOFF = 55

# How many name‑only candidates to shortlist before the artist re‑rank pass
SHORTLIST_SIZE = 15

# Weights for the combined score (must sum to 1.0)
WEIGHT_SONG_NAME = 0.6
WEIGHT_ARTIST = 0.4

# Final combined‑score threshold to accept a match
COMBINED_SCORE_CUTOFF = 65


def _normalize_text(value) -> str:
    """Lowercase, collapse whitespace, strip edges."""
    return " ".join(str(value).strip().lower().split())


def resolve_song_row(
    song_name: str,
    songs_data: pd.DataFrame,
    artist_name: str = None,
    score_cutoff: int = COMBINED_SCORE_CUTOFF,
):
    """
    Resolve a song row using a Google‑like multi‑field fuzzy search.

    Strategy
    --------
    1. **Exact match** — fast path; checks name (+ artist if provided).
    2. **First pass** — fuzzy‑match song name alone against the `name`
       column using `token_sort_ratio` (tolerates word‑order swaps).
       Keep the top SHORTLIST_SIZE candidates above SONG_NAME_CUTOFF.
    3. **Second pass** — if an artist was provided, score every
       shortlisted candidate's artist field and compute a weighted
       combined score:  `0.6 × name_score + 0.4 × artist_score`.
    4. **Accept** the best candidate whose combined score ≥ threshold.
    """

    normalized_song = _normalize_text(song_name)
    normalized_artist = _normalize_text(artist_name) if artist_name else ""

    if songs_data.empty or not normalized_song:
        return None, None

    # ── 1. Exact match (fast path) ────────────────────────────────────
    if normalized_artist:
        exact = songs_data.loc[
            (songs_data["name"] == normalized_song)
            & (songs_data["artist"] == normalized_artist)
        ]
    else:
        exact = songs_data.loc[songs_data["name"] == normalized_song]

    if not exact.empty:
        matched_row = exact.iloc[0]
        return matched_row, matched_row.name

    # ── 2. First pass — fuzzy match on song name ─────────────────────
    name_choices = songs_data["name"].astype(str).tolist()

    # extractOne is fast but we need the top‑N, so use extract
    name_hits = process.extract(
        normalized_song,
        name_choices,
        scorer=fuzz.token_sort_ratio,
        score_cutoff=SONG_NAME_CUTOFF,
        limit=SHORTLIST_SIZE,
    )

    if not name_hits:
        return None, None

    # ── 3. Second pass — re‑rank with artist if provided ─────────────
    if normalized_artist:
        best_score = -1
        best_index = None

        for _matched_name, name_score, idx in name_hits:
            candidate_artist = _normalize_text(
                songs_data.iloc[idx]["artist"]
            )
            artist_score = fuzz.token_sort_ratio(
                normalized_artist, candidate_artist
            )
            combined = (
                WEIGHT_SONG_NAME * name_score
                + WEIGHT_ARTIST * artist_score
            )
            if combined > best_score:
                best_score = combined
                best_index = idx

        if best_score < score_cutoff:
            return None, None

        matched_row = songs_data.iloc[best_index]
        return matched_row, matched_row.name

    # ── No artist provided — just take the best name hit ─────────────
    best_name, best_score, best_index = name_hits[0]

    if best_score < score_cutoff:
        return None, None

    matched_row = songs_data.iloc[best_index]
    return matched_row, matched_row.name
