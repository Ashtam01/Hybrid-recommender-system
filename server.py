"""
FastAPI backend for the Spotify Hybrid Recommender System.

Loads all heavy resources (matrices, DataFrames) once at startup via the
lifespan context manager.  Every /api/recommend and /api/search call reuses
them from memory — no per-request I/O.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from scipy.sparse import load_npz
from rapidfuzz import fuzz, process

from hybrid_recommendations import HybridRecommenderSystem

# ── Logging ────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────────
# Docker/Render copies data into data/ at build time (from runtime_data/).
# Local dev uses data/ directly. Both work with the same path.
DATA_DIR = Path("data")
COLLAB_FILTERED_CSV = DATA_DIR / "collab_filtered_data.csv"
TRANSFORMED_HYBRID_NPZ = DATA_DIR / "transformed_hybrid_data.npz"
INTERACTION_MATRIX_NPZ = DATA_DIR / "interaction_matrix.npz"
TRACK_IDS_NPY = DATA_DIR / "track_ids.npy"

# ── Audio feature columns available in collab_filtered_data.csv ───────
AUDIO_FEATURE_COLS = [
    "danceability", "energy", "valence", "tempo",
    "acousticness", "speechiness", "instrumentalness", "liveness",
    "loudness", "duration_ms", "key", "mode", "time_signature",
]


# ── In-memory resource container ──────────────────────────────────────
@dataclass
class Resources:
    """Immutable holder for pre-loaded data — set once at startup."""
    songs_data: pd.DataFrame
    transformed_matrix: object      # scipy sparse matrix
    interaction_matrix: object      # scipy sparse matrix
    track_ids: np.ndarray


resources: Resources | None = None


# ── Lifespan: load once, serve forever ────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global resources

    logger.info("Loading resources into memory...")

    songs_data = pd.read_csv(COLLAB_FILTERED_CSV)
    logger.info(f"  songs_data:          {len(songs_data):,} rows")

    transformed_matrix = load_npz(str(TRANSFORMED_HYBRID_NPZ))
    logger.info(f"  transformed_matrix:  {transformed_matrix.shape}")

    interaction_matrix = load_npz(str(INTERACTION_MATRIX_NPZ))
    logger.info(f"  interaction_matrix:  {interaction_matrix.shape}")

    track_ids = np.load(str(TRACK_IDS_NPY), allow_pickle=True)
    logger.info(f"  track_ids:           {track_ids.shape[0]:,} ids")

    resources = Resources(
        songs_data=songs_data,
        transformed_matrix=transformed_matrix,
        interaction_matrix=interaction_matrix,
        track_ids=track_ids,
    )

    logger.info("All resources loaded. Server ready.")
    yield
    logger.info("Shutting down — releasing resources.")
    resources = None


# ── FastAPI app ────────────────────────────────────────────────────────
app = FastAPI(
    title="Sonic Recommender API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow Vite dev server and common local origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic Schemas ──────────────────────────────────────────────────
class RecommendRequest(BaseModel):
    song_name: str = Field(..., min_length=1, description="Song title")
    artist_name: str = Field(..., min_length=1, description="Artist name")
    weight_content: float = Field(0.5, ge=0.0, le=1.0)
    weight_collaborative: float = Field(0.5, ge=0.0, le=1.0)
    num_recommendations: int = Field(10, ge=1, le=50)


class TrackResponse(BaseModel):
    name: str
    artist: str
    spotify_preview_url: Optional[str] = None
    danceability: Optional[float] = None
    energy: Optional[float] = None
    valence: Optional[float] = None
    tempo: Optional[float] = None
    acousticness: Optional[float] = None
    speechiness: Optional[float] = None
    instrumentalness: Optional[float] = None
    liveness: Optional[float] = None


class RecommendResponse(BaseModel):
    seed: TrackResponse
    recommendations: list[TrackResponse]
    weight_content: float
    weight_collaborative: float


class SearchResult(BaseModel):
    name: str
    artist: str
    score: float


class SearchResponse(BaseModel):
    results: list[SearchResult]


# ── Helpers ───────────────────────────────────────────────────────────
def _df_row_to_track(row: pd.Series) -> TrackResponse:
    """Convert a DataFrame row to a TrackResponse, safely handling missing cols."""
    data: dict = {
        "name": str(row.get("name", "")).title(),
        "artist": str(row.get("artist", "")).title(),
        "spotify_preview_url": row.get("spotify_preview_url"),
    }
    for col in ["danceability", "energy", "valence", "tempo",
                "acousticness", "speechiness", "instrumentalness", "liveness"]:
        val = row.get(col)
        if val is not None and pd.notna(val):
            data[col] = float(val)
    return TrackResponse(**data)


def _normalize_text(value: str) -> str:
    return " ".join(str(value).strip().lower().split())


# ── Endpoints ─────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    if resources is None:
        raise HTTPException(503, "Resources not loaded")
    return {
        "status": "ok",
        "songs_count": len(resources.songs_data),
        "track_ids_count": int(resources.track_ids.shape[0]),
    }


@app.post("/api/recommend", response_model=RecommendResponse)
async def recommend(req: RecommendRequest):
    if resources is None:
        raise HTTPException(503, "Server is still loading resources")

    # Normalize weights so they sum to 1.0
    total = req.weight_content + req.weight_collaborative
    if total == 0:
        raise HTTPException(400, "Weights cannot both be zero")
    w_content = req.weight_content / total
    w_collab = req.weight_collaborative / total

    try:
        recommender = HybridRecommenderSystem(
            song_name=req.song_name,
            artist_name=req.artist_name,
            number_of_recommendations=req.num_recommendations,
            weight_content_based=w_content,
            weight_collaborative=w_collab,
            songs_data=resources.songs_data,
            transformed_matrix=resources.transformed_matrix,
            interaction_matrix=resources.interaction_matrix,
            track_ids=resources.track_ids,
        )
        results_df = recommender.give_recommendations()
    except ValueError as exc:
        raise HTTPException(404, str(exc))
    except Exception as exc:
        logger.exception("Recommendation pipeline failed")
        raise HTTPException(500, f"Internal error: {exc}")

    if results_df is None or results_df.empty:
        raise HTTPException(404, "No recommendations found")

    # The first row is the seed song itself (highest similarity = 1.0)
    seed_row = results_df.iloc[0]
    rec_rows = results_df.iloc[1:]

    # Enrich with audio features from the full songs_data
    seed_full = resources.songs_data.loc[
        (resources.songs_data["name"] == seed_row.get("name"))
        & (resources.songs_data["artist"] == seed_row.get("artist"))
    ]
    seed_track = _df_row_to_track(
        seed_full.iloc[0] if not seed_full.empty else seed_row
    )

    recommendations = []
    for _, row in rec_rows.iterrows():
        # Look up full row with audio features
        full_match = resources.songs_data.loc[
            (resources.songs_data["name"] == row.get("name"))
            & (resources.songs_data["artist"] == row.get("artist"))
        ]
        track = _df_row_to_track(
            full_match.iloc[0] if not full_match.empty else row
        )
        recommendations.append(track)

    return RecommendResponse(
        seed=seed_track,
        recommendations=recommendations,
        weight_content=w_content,
        weight_collaborative=w_collab,
    )


@app.get("/api/search", response_model=SearchResponse)
async def search(q: str = "", limit: int = 8):
    if resources is None:
        raise HTTPException(503, "Server is still loading resources")

    query = _normalize_text(q)
    if len(query) < 2:
        return SearchResponse(results=[])

    songs_data = resources.songs_data
    name_choices = songs_data["name"].astype(str).tolist()

    # Fuzzy match on song name
    hits = process.extract(
        query,
        name_choices,
        scorer=fuzz.token_sort_ratio,
        score_cutoff=45,
        limit=limit * 3,  # over-fetch to deduplicate
    )

    if not hits:
        return SearchResponse(results=[])

    # Deduplicate by (name, artist) pair and cap at limit
    seen: set[tuple[str, str]] = set()
    results: list[SearchResult] = []

    for matched_name, score, idx in hits:
        row = songs_data.iloc[idx]
        name = str(row["name"]).title()
        artist = str(row["artist"]).title()
        key = (name.lower(), artist.lower())

        if key in seen:
            continue
        seen.add(key)

        results.append(SearchResult(
            name=name,
            artist=artist,
            score=round(score, 1),
        ))

        if len(results) >= limit:
            break

    return SearchResponse(results=results)


class ArtistSong(BaseModel):
    name: str
    artist: str


class ArtistSearchResult(BaseModel):
    artist: str
    songs: list[ArtistSong]
    score: float


class ArtistSearchResponse(BaseModel):
    results: list[ArtistSearchResult]


@app.get("/api/search-artists", response_model=ArtistSearchResponse)
async def search_artists(q: str = "", limit: int = 6):
    if resources is None:
        raise HTTPException(503, "Server is still loading resources")

    query = _normalize_text(q)
    if len(query) < 2:
        return ArtistSearchResponse(results=[])

    songs_data = resources.songs_data

    # Build unique artist list for fuzzy matching
    unique_artists = songs_data["artist"].dropna().unique().tolist()

    hits = process.extract(
        query,
        unique_artists,
        scorer=fuzz.token_sort_ratio,
        score_cutoff=45,
        limit=limit,
    )

    if not hits:
        return ArtistSearchResponse(results=[])

    results: list[ArtistSearchResult] = []

    for matched_artist, score, _idx in hits:
        # Get songs by this artist (limit to 5 for the dropdown)
        artist_songs = (
            songs_data
            .loc[songs_data["artist"] == matched_artist, ["name", "artist"]]
            .drop_duplicates(subset=["name"])
            .head(5)
        )

        songs = [
            ArtistSong(
                name=str(row["name"]).title(),
                artist=str(row["artist"]).title(),
            )
            for _, row in artist_songs.iterrows()
        ]

        results.append(ArtistSearchResult(
            artist=str(matched_artist).title(),
            songs=songs,
            score=round(score, 1),
        ))

    return ArtistSearchResponse(results=results)

