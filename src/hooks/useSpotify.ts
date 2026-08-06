import { useState, useEffect, useCallback, useRef } from "react";

export interface SpotifyTrack {
  isPlaying: boolean;
  title: string;
  artist: string;
  albumArt: string | null;
  songUrl: string | null;
  lastPlayedAt?: string;
}

interface LanyardResponse {
  success: boolean;
  data: {
    listening_to_spotify: boolean;
    spotify: {
      track_id: string;
      song: string;
      artist: string;
      album: string;
      album_art_url: string;
    } | null;
  };
}

export interface UseSpotifyOptions {
  /** Discord user ID tracked by the Lanyard presence API. */
  discordId: string;
  /** Poll interval in ms. Default: 15000 */
  pollInterval?: number;
  /** localStorage key used to remember the last played track. Default: "spotify_last_played" */
  storageKey?: string;
}

interface UseSpotifyReturn {
  data: SpotifyTrack | null;
  loading: boolean;
  error: string | null;
}

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

export function useSpotify({
  discordId,
  pollInterval = 15_000,
  storageKey = "spotify_last_played",
}: UseSpotifyOptions): UseSpotifyReturn {
  const [data, setData] = useState<SpotifyTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Current track kept in a ref so polling never resets the interval.
  const currentTrackRef = useRef<SpotifyTrack | null>(null);

  const readCache = useCallback((): SpotifyTrack | null => {
    if (typeof window === "undefined") return null;
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return null;
    try {
      const parsed: SpotifyTrack = JSON.parse(saved);
      const at = parsed.lastPlayedAt ? new Date(parsed.lastPlayedAt).getTime() : 0;
      if (parsed.lastPlayedAt && Date.now() - at > ONE_WEEK) return null;
      return { ...parsed, isPlaying: false };
    } catch {
      return null;
    }
  }, [storageKey]);

  const fetchPresence = useCallback(async () => {
    if (!discordId) {
      setError("Discord ID not configured");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`https://api.lanyard.rest/v1/users/${discordId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: LanyardResponse = await res.json();

      if (json.success && json.data) {
        const { listening_to_spotify, spotify } = json.data;

        if (listening_to_spotify && spotify) {
          const track: SpotifyTrack = {
            isPlaying: true,
            title: spotify.song,
            artist: spotify.artist,
            albumArt: spotify.album_art_url,
            songUrl: `https://open.spotify.com/track/${spotify.track_id}`,
            lastPlayedAt: new Date().toISOString(),
          };
          currentTrackRef.current = track;
          setData(track);
          window.localStorage.setItem(storageKey, JSON.stringify(track));
        } else if (currentTrackRef.current) {
          // Was playing during this session — fade to "Last Played".
          const offline = { ...currentTrackRef.current, isPlaying: false };
          currentTrackRef.current = offline;
          setData(offline);
        } else {
          const cached = readCache();
          currentTrackRef.current = cached;
          setData(cached);
        }
        setError(null);
      }
    } catch {
      if (!currentTrackRef.current) {
        const cached = readCache();
        currentTrackRef.current = cached;
        setData(cached);
      }
      setError("Could not load Spotify data");
    } finally {
      setLoading(false);
    }
  }, [discordId, readCache, storageKey]);

  useEffect(() => {
    fetchPresence();
    const interval = setInterval(fetchPresence, pollInterval);
    return () => clearInterval(interval);
  }, [fetchPresence, pollInterval]);

  return { data, loading, error };
}
