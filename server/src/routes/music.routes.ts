import { Router, Response } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';
import { Playlist, UserMusicPreference, ISong } from '../models/UserMusic';

const router = Router();

// Proxy search to iTunes API (public)
router.get('/search', async (req, res) => {
  try {
    const { term, country } = req.query;
    if (!term) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    // Try JioSaavn API first to get full-length songs
    const saavnMirrors = [
      'https://saavn.sumit.co',
      'https://jiosaavn-api-sigma.vercel.app'
    ];

    for (const base of saavnMirrors) {
      try {
        const saavnUrl = `${base}/api/search/songs?query=${encodeURIComponent(term as string)}`;
        const response = await fetch(saavnUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.results && data.data.results.length > 0) {
            // Map to iTunes format for complete frontend compatibility
            const mappedResults = data.data.results.map((song: any) => {
              const downloadUrls = song.downloadUrl || [];
              // Pick highest quality (last item is usually 320kbps MP3)
              const bestAudio = downloadUrls[downloadUrls.length - 1] || downloadUrls.find((d: any) => d.quality === '160kbps') || {};
              const audioUrl = bestAudio.url || '';

              // Handle primary artists array
              const artistsList = song.artists && song.artists.primary 
                ? song.artists.primary.map((a: any) => a.name).join(', ') 
                : 'Unknown Artist';

              // Handle artwork images
              const images = song.image || [];
              const bestImage = images[images.length - 1] || {};
              const artworkUrl = bestImage.url || '';

              return {
                trackId: String(song.id),
                trackName: song.name,
                artistName: artistsList,
                collectionName: song.album?.name || 'Single',
                trackTimeMillis: (song.duration || 30) * 1000,
                previewUrl: audioUrl,
                artworkUrl100: artworkUrl
              };
            });

            return res.json({ results: mappedResults });
          }
        }
      } catch (err: any) {
        console.warn(`JioSaavn search mirror ${base} failed:`, err.message);
      }
    }

    // Fallback to original iTunes Search API if JioSaavn mirrors are offline
    console.log('Falling back to iTunes Search API for:', term);
    const countryParam = country ? `&country=${country}` : '';
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term as string)}${countryParam}&media=music&entity=song&limit=100`;
    
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Error in search fallback:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch music search results' });
  }
});

// --- Playlists ---

router.get('/playlists', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    let playlists = await Playlist.find({ userId }).sort({ createdAt: -1 });

    // Seed default playlists if user has none
    if (playlists.length === 0 && userId) {
      console.log('Seeding default playlists from JioSaavn API for user:', userId);
      try {
        const seedCategories = [
          { name: 'Bollywood Hits', query: 'Bollywood Hits', fallbackKey: 'bollywood' },
          { name: 'Punjabi Hits', query: 'Punjabi Hits', fallbackKey: 'punjabi' },
          { name: 'Hindi Romantic (KK & Arijit)', query: 'Hindi Romantic', fallbackKey: 'romantic' },
          { name: 'English Pop Hits', query: 'English Pop', fallbackKey: 'english' }
        ];

        // Static fallbacks in case JioSaavn fetches fail
        const fallbacks: any = {
          bollywood: [
            {
              id: "bollywood_1",
              title: "Tum Hi Ho",
              artist: "Arijit Singh",
              album: "Aashiqui 2",
              duration: 262000,
              previewUrl: "https://aac.saavncdn.com/102/5d99676e737c3fb3c6cb19dfb7d9036c_160.mp4",
              artworkUrl100: "https://c.saavncdn.com/102/Aashiqui-2-Hindi-2013-500x500.jpg"
            },
            {
              id: "bollywood_2",
              title: "Kesariya",
              artist: "Arijit Singh, Pritam",
              album: "Brahmastra",
              duration: 268000,
              previewUrl: "https://aac.saavncdn.com/974/a933f7c9e1601a073deeb55157149a40_160.mp4",
              artworkUrl100: "https://c.saavncdn.com/974/Brahmastra-Hindi-2022-500x500.jpg"
            }
          ],
          punjabi: [
            {
              id: "punjabi_1",
              title: "Proper Patola",
              artist: "Diljit Dosanjh, Badshah",
              album: "Proper Patola",
              duration: 180000,
              previewUrl: "https://aac.saavncdn.com/712/ec78efab94b4ff30959b3607a72666a0_160.mp4",
              artworkUrl100: "https://c.saavncdn.com/712/Proper-Patola-Punjabi-2013-500x500.jpg"
            },
            {
              id: "punjabi_2",
              title: "Brown Munde",
              artist: "AP Dhillon, Gurinder Gill",
              album: "Brown Munde",
              duration: 267000,
              previewUrl: "https://aac.saavncdn.com/647/e112d7c0f1b212f1cfbb52309197a1d1_160.mp4",
              artworkUrl100: "https://c.saavncdn.com/647/Brown-Munde-Punjabi-2020-500x500.jpg"
            }
          ],
          romantic: [
            {
              id: "romantic_1",
              title: "Dil Ibaadat",
              artist: "KK, Pritam",
              album: "Tum Mile",
              duration: 329000,
              previewUrl: "https://aac.saavncdn.com/316/7bc5895688704839a1686d3afb07bb7d_160.mp4",
              artworkUrl100: "https://c.saavncdn.com/316/Tum-Mile-Hindi-2009-500x500.jpg"
            },
            {
              id: "romantic_2",
              title: "Zara Sa",
              artist: "KK, Pritam",
              album: "Jannat",
              duration: 301000,
              previewUrl: "https://aac.saavncdn.com/835/db4bb24e650c8bb90f7a08b5ea912ab8_160.mp4",
              artworkUrl100: "https://c.saavncdn.com/835/Jannat-Hindi-2008-500x500.jpg"
            }
          ],
          english: [
            {
              id: "english_1",
              title: "Shape of You",
              artist: "Ed Sheeran",
              album: "Divide",
              duration: 233000,
              previewUrl: "https://aac.saavncdn.com/694/b53b8b15d2a210d7a6e74b5c7bdcfbe6_160.mp4",
              artworkUrl100: "https://c.saavncdn.com/694/Shape-of-You-English-2017-500x500.jpg"
            },
            {
              id: "english_2",
              title: "Blinding Lights",
              artist: "The Weeknd",
              album: "After Hours",
              duration: 200000,
              previewUrl: "https://aac.saavncdn.com/732/6c7eeeb15da16bbf69e8b7c4bd4f5b5b_160.mp4",
              artworkUrl100: "https://c.saavncdn.com/732/Blinding-Lights-English-2019-500x500.jpg"
            }
          ]
        };

        for (const cat of seedCategories) {
          let playlistSongs: any[] = [];
          try {
            // Search playlist on sumit.co
            const searchRes = await fetch(`https://saavn.sumit.co/api/search/playlists?query=${encodeURIComponent(cat.query)}`);
            if (searchRes.ok) {
              const searchJson = await searchRes.json();
              if (searchJson && searchJson.success && searchJson.data && searchJson.data.results && searchJson.data.results.length > 0) {
                const targetPlaylist = searchJson.data.results[0];
                
                // Fetch playlist details
                const detailRes = await fetch(`https://saavn.sumit.co/api/playlists?id=${targetPlaylist.id}`);
                if (detailRes.ok) {
                  const detailJson = await detailRes.json();
                  if (detailJson && detailJson.success && detailJson.data && detailJson.data.songs && detailJson.data.songs.length > 0) {
                    playlistSongs = detailJson.data.songs.slice(0, 10).map((song: any) => {
                      const downloadUrls = song.downloadUrl || [];
                      const bestAudio = downloadUrls[downloadUrls.length - 1] || downloadUrls.find((d: any) => d.quality === '160kbps') || {};
                      const artistsList = song.artists && song.artists.primary 
                        ? song.artists.primary.map((a: any) => a.name).join(', ') 
                        : 'Unknown Artist';
                      const images = song.image || [];
                      const artworkUrl = images[images.length - 1]?.url || '';

                      return {
                        id: String(song.id),
                        title: song.name,
                        artist: artistsList,
                        album: song.album?.name || 'Single',
                        duration: (song.duration || 30) * 1000,
                        previewUrl: bestAudio.url || '',
                        artworkUrl100: artworkUrl
                      };
                    });
                  }
                }
              }
            }
          } catch (fetchErr: any) {
            console.warn(`JioSaavn search/playlist details failed for ${cat.name}, using static fallback:`, fetchErr.message);
          }

          // Use fallback if API returned 0 songs
          if (playlistSongs.length === 0) {
            playlistSongs = fallbacks[cat.fallbackKey] || [];
          }

          if (playlistSongs.length > 0) {
            await Playlist.create({
              userId,
              name: cat.name,
              songs: playlistSongs
            });
          }
        }
        
        playlists = await Playlist.find({ userId }).sort({ createdAt: -1 });
      } catch (seedErr) {
        console.error('Error seeding static fallback playlists:', seedErr);
      }
    }

    res.json(playlists);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve playlists' });
  }
});

// Create a new playlist
router.post('/playlists', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Playlist name is required' });
    }

    const playlist = await Playlist.create({
      userId,
      name: name.trim(),
      songs: []
    });
    res.status(201).json(playlist);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// Rename a playlist
router.put('/playlists/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Playlist name is required' });
    }

    const playlist = await Playlist.findOneAndUpdate(
      { _id: id, userId },
      { name: name.trim() },
      { new: true }
    );

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    res.json(playlist);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to rename playlist' });
  }
});

// Delete a playlist
router.delete('/playlists/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const playlist = await Playlist.findOneAndDelete({ _id: id, userId });
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    res.json({ message: 'Playlist deleted successfully', id });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

// Add a song to playlist
router.post('/playlists/:id/songs', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const song: ISong = req.body;

    if (!song || !song.id || !song.title || !song.artist || !song.previewUrl) {
      return res.status(400).json({ error: 'Invalid song structure' });
    }

    const playlist = await Playlist.findOne({ _id: id, userId });
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Check if song already exists in playlist to avoid duplicates
    if (playlist.songs.some(s => s.id === song.id)) {
      return res.status(400).json({ error: 'Song already in playlist' });
    }

    playlist.songs.push(song);
    await playlist.save();
    res.json(playlist);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add song to playlist' });
  }
});

// Remove a song from playlist
router.delete('/playlists/:id/songs/:songId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id, songId } = req.params;

    const playlist = await Playlist.findOne({ _id: id, userId });
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    playlist.songs = playlist.songs.filter(s => s.id !== songId);
    await playlist.save();
    res.json(playlist);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to remove song from playlist' });
  }
});

// Reorder songs within a playlist (accepts a full array of songs)
router.put('/playlists/:id/songs/reorder', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { songs } = req.body;

    if (!Array.isArray(songs)) {
      return res.status(400).json({ error: 'Songs list is required' });
    }

    const playlist = await Playlist.findOneAndUpdate(
      { _id: id, userId },
      { songs },
      { new: true }
    );

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    res.json(playlist);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to reorder playlist' });
  }
});

// --- Favorites (Liked Songs) ---

// Get user's favorites
router.get('/favorites', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const pref = await UserMusicPreference.findOne({ userId });
    res.json(pref ? pref.favorites : []);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve favorites' });
  }
});

// Add song to favorites
router.post('/favorites', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const song: ISong = req.body;

    if (!song || !song.id || !song.title || !song.artist || !song.previewUrl) {
      return res.status(400).json({ error: 'Invalid song structure' });
    }

    let pref = await UserMusicPreference.findOne({ userId });
    if (!pref) {
      pref = new UserMusicPreference({ userId, favorites: [], history: [], playCounts: [] });
    }

    if (!pref.favorites.some(s => s.id === song.id)) {
      pref.favorites.push(song);
      await pref.save();
    }

    res.json(pref.favorites);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add to favorites' });
  }
});

// Remove song from favorites
router.delete('/favorites/:songId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { songId } = req.params;

    const pref = await UserMusicPreference.findOne({ userId });
    if (!pref) {
      return res.status(404).json({ error: 'Favorites list not found' });
    }

    pref.favorites = pref.favorites.filter(s => s.id !== songId);
    await pref.save();
    res.json(pref.favorites);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to remove from favorites' });
  }
});

// --- Listening History ---

// Get recently played & most played
router.get('/history', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const pref = await UserMusicPreference.findOne({ userId });
    if (!pref) {
      return res.json({ recent: [], mostPlayed: [] });
    }

    // Sort history by playedAt descending
    const recent = [...pref.history].sort((a: any, b: any) => b.playedAt.getTime() - a.playedAt.getTime());
    
    // Sort playCounts by count descending to get Most Played
    const mostPlayed = [...pref.playCounts]
      .sort((a, b) => b.count - a.count)
      .map(pc => pc.song)
      .slice(0, 15);

    res.json({ recent: recent.slice(0, 30), mostPlayed });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve listening history' });
  }
});

// Add song to history and increment play count
router.post('/history', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const song: ISong = req.body;

    if (!song || !song.id || !song.title || !song.artist || !song.previewUrl) {
      return res.status(400).json({ error: 'Invalid song structure' });
    }

    let pref = await UserMusicPreference.findOne({ userId });
    if (!pref) {
      pref = new UserMusicPreference({ userId, favorites: [], history: [], playCounts: [] });
    }

    // Add to history
    pref.history.push({
      ...song,
      playedAt: new Date()
    } as any);

    // Keep history trimmed to last 50 songs
    if (pref.history.length > 50) {
      pref.history.shift();
    }

    // Update play counts
    const pcIndex = pref.playCounts.findIndex(pc => pc.songId === song.id);
    if (pcIndex !== -1) {
      pref.playCounts[pcIndex].count += 1;
    } else {
      pref.playCounts.push({
        songId: song.id,
        count: 1,
        song
      });
    }

    await pref.save();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to record playback history' });
  }
});

export default router;
