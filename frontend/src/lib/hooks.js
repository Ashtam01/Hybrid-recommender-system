/**
 * React Query hooks for the Sonic Recommender.
 *
 * - useRecommendations: cached by (song, artist, weights, k).
 *   Identical queries served instantly from cache for 5 minutes.
 * - useSearch: cached by query string with 300ms debounce.
 */

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { fetchRecommendations, searchSongs, searchArtists } from "./api";

// ── useDebouncedValue ─────────────────────────────────────────────────

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

// ── useRecommendations ────────────────────────────────────────────────

/**
 * Fetch and cache hybrid recommendations.
 * Cache key: ['recommendations', song, artist, contentWeight, collabWeight, k]
 * staleTime: 5 minutes — identical queries (same slider position) are instant.
 *
 * @param {{ songName: string, artistName: string, weightContent: number, weightCollaborative: number, numRecommendations?: number }} params
 */
export function useRecommendations({
  songName,
  artistName,
  weightContent,
  weightCollaborative,
  numRecommendations = 10,
}) {
  // Round weights to 2 decimal places for stable cache keys
  const roundedContent = Math.round(weightContent * 100) / 100;
  const roundedCollab = Math.round(weightCollaborative * 100) / 100;

  return useQuery({
    queryKey: [
      "recommendations",
      songName.toLowerCase().trim(),
      artistName.toLowerCase().trim(),
      roundedContent,
      roundedCollab,
      numRecommendations,
    ],
    queryFn: () =>
      fetchRecommendations({
        song_name: songName,
        artist_name: artistName,
        weight_content: roundedContent,
        weight_collaborative: roundedCollab,
        num_recommendations: numRecommendations,
      }),
    // Only run when we have both song and artist
    enabled: songName.trim().length > 0 && artistName.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes — identical queries are instant
    gcTime: 10 * 60 * 1000, // keep in garbage-collectible cache for 10 min
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

// ── useSearch (with debounce) ─────────────────────────────────────────

/**
 * Fuzzy search with 300ms debounce and 30s cache.
 * @param {string} query
 * @param {number} limit
 */
export function useSearch(query, limit = 8) {
  const debouncedQuery = useDebouncedValue(query, 300);

  return useQuery({
    queryKey: ["search", debouncedQuery.toLowerCase().trim()],
    queryFn: () => searchSongs(debouncedQuery, limit),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30 * 1000, // 30 seconds for search results
    gcTime: 2 * 60 * 1000,
    retry: 0, // don't retry search — just show empty
    refetchOnWindowFocus: false,
  });
}

// ── useArtistSearch (with debounce) ───────────────────────────────────

/**
 * Fuzzy search artists with 300ms debounce and 30s cache.
 * Returns artist names with their top songs.
 * @param {string} query
 * @param {number} limit
 */
export function useArtistSearch(query, limit = 6) {
  const debouncedQuery = useDebouncedValue(query, 300);

  return useQuery({
    queryKey: ["search-artists", debouncedQuery.toLowerCase().trim()],
    queryFn: () => searchArtists(debouncedQuery, limit),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
  });
}

