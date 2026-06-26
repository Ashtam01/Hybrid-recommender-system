/**
 * API client for the Sonic Recommender backend.
 *
 * All fetch calls go through typed wrappers so the rest of the app never
 * deals with raw fetch/JSON.  Base URL is configurable via VITE_API_URL
 * env var (defaults to localhost:8000 for local dev).
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ── API Error ─────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(status, detail) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function handleResponse(res) {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // response isn't JSON — use status text
    }
    throw new ApiError(res.status, detail);
  }
  return res.json();
}

// ── API calls ─────────────────────────────────────────────────────────

/**
 * Fetch hybrid recommendations from the backend.
 * @param {{ song_name: string, artist_name: string, weight_content: number, weight_collaborative: number, num_recommendations?: number }} req
 * @returns {Promise<{ seed: object, recommendations: object[], weight_content: number, weight_collaborative: number }>}
 */
export async function fetchRecommendations(req) {
  const res = await fetch(`${API_BASE}/api/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      song_name: req.song_name,
      artist_name: req.artist_name,
      weight_content: req.weight_content,
      weight_collaborative: req.weight_collaborative,
      num_recommendations: req.num_recommendations ?? 10,
    }),
  });
  return handleResponse(res);
}

/**
 * Fuzzy search songs by name.
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<Array<{ name: string, artist: string, score: number }>>}
 */
export async function searchSongs(query, limit = 8) {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/search?${params}`);
  const data = await handleResponse(res);
  return data.results;
}

/**
 * Fuzzy search artists by name. Returns artists with their top songs.
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<Array<{ artist: string, songs: Array<{ name: string, artist: string }>, score: number }>>}
 */
export async function searchArtists(query, limit = 6) {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/search-artists?${params}`);
  const data = await handleResponse(res);
  return data.results;
}
