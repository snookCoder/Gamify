import React, { useState, useEffect } from 'react';
import { useMusicStore, Song } from '../../store/useMusicStore';
import { Search, ListMusic, Heart, History, Plus, Trash2, Play, FolderPlus, Edit3, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MusicSidebar: React.FC = () => {
  const {
    searchResults,
    playlists,
    favorites,
    recentHistory,
    mostPlayed,
    searchQuery,
    isSearching,
    isLoadingLists,
    searchSongs,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    toggleFavorite,
    playPlaylist,
    playSong,
    addToQueue,
    isRoomMode,
    room,
    trendingSongs
  } = useMusicStore();

  const [activeTab, setActiveTab] = useState<'search' | 'playlists' | 'favorites' | 'history'>('search');
  const [searchInput, setSearchInput] = useState('');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isEditingPlaylistId, setIsEditingPlaylistId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [songMenuId, setSongMenuId] = useState<string | null>(null);

  // Trigger search on debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim()) {
        searchSongs(searchInput);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [searchInput, searchSongs]);

  // Fetch lists on load
  useEffect(() => {
    useMusicStore.getState().fetchPlaylists();
    useMusicStore.getState().fetchFavorites();
    useMusicStore.getState().fetchHistory();
    useMusicStore.getState().fetchTrendingSongs();
  }, []);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    await createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowCreateInput(false);
  };

  const handleRenamePlaylist = async (id: string) => {
    if (!renameInput.trim()) return;
    await renamePlaylist(id, renameInput.trim());
    setIsEditingPlaylistId(null);
    setRenameInput('');
  };

  const selectedPlaylist = playlists.find(p => p._id === selectedPlaylistId);

  const formatDuration = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full lg:w-80 h-full glass-panel border border-white/5 rounded-3xl flex flex-col overflow-hidden relative shadow-2xl">
      {/* Background Gradient */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />

      {/* Tabs Header */}
      <div className="flex border-b border-white/5 bg-slate-950/20 p-2 gap-1.5 select-none z-10 shrink-0">
        {[
          { id: 'search', label: 'Search', icon: Search },
          { id: 'playlists', label: 'Playlists', icon: ListMusic },
          { id: 'favorites', label: 'Liked', icon: Heart },
          { id: 'history', label: 'History', icon: History }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSongMenuId(null);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-2xl text-[10px] md:text-xs font-bold transition-all relative cursor-pointer
                ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-purple-500/10 border border-emerald-500/20 rounded-2xl -z-10"
                />
              )}
              <Icon className={`w-4 h-4 mb-1 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 z-10">
        <AnimatePresence mode="wait">
          {/* SEARCH TAB */}
          {activeTab === 'search' && (
            <motion.div
              key="search-tab"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex flex-col gap-4 h-full"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Songs, artist, album, hindi, KK..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans"
                />
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
              </div>

              <div className="flex-1 space-y-2">
                {isSearching ? (
                  <div className="py-12 text-center text-xs text-gray-500 font-mono animate-pulse">Searching music archive...</div>
                ) : (searchResults.length === 0 && searchInput.trim() !== '') ? (
                  <div className="py-12 text-center text-xs text-gray-500 italic">
                    No songs found. Try search Arijit, KK, Atif, English...
                  </div>
                ) : (
                  <>
                    {searchResults.length === 0 && searchInput.trim() === '' && (
                      <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest font-mono mb-2">
                        🔥 Recommended Hits
                      </div>
                    )}
                    {(searchResults.length > 0 ? searchResults : trendingSongs).map(song => (
                      <div
                        key={song.id}
                        className="group flex items-center justify-between p-2.5 bg-slate-900/30 border border-white/5 rounded-2xl hover:bg-slate-900/70 hover:border-emerald-500/20 transition-all card-transition"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => playSong(song)}>
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-purple-500/20 flex items-center justify-center text-emerald-450 border border-white/5 relative overflow-hidden group-hover:scale-105 transition-transform shrink-0">
                            <Play className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity absolute text-white" />
                            <Music className="w-4 h-4 group-hover:opacity-0 transition-opacity" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-gray-200 truncate group-hover:text-white transition-colors">{song.title}</div>
                            <div className="text-[10px] text-gray-400 truncate mt-0.5">{song.artist}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            onClick={() => toggleFavorite(song)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Like Song"
                          >
                            <Heart className={`w-3.5 h-3.5 ${favorites.some(f => f.id === song.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                          </button>
                          
                          <button
                            onClick={() => addToQueue(song)}
                            className="px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-450 text-[10px] font-black tracking-wide transition-all cursor-pointer"
                            title="Add to Queue"
                          >
                            + Queue
                          </button>
                          
                          <div className="relative">
                            <button
                              onClick={() => setSongMenuId(songMenuId === song.id ? null : song.id)}
                              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors cursor-pointer"
                              title="Add to Playlist"
                            >
                              <ListMusic className="w-3.5 h-3.5" />
                            </button>
                            
                            {songMenuId === song.id && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setSongMenuId(null)} />
                                <div className="absolute right-0 bottom-full mb-1 w-40 bg-slate-950 border border-white/10 rounded-xl p-1.5 shadow-2xl z-40 text-left">
                                  <div className="px-2 py-1 text-[8px] text-gray-500 uppercase tracking-widest font-black">Add to Playlist</div>
                                  {playlists.length > 0 ? (
                                    playlists.map(pl => (
                                      <button
                                        key={pl._id}
                                        onClick={() => {
                                          addSongToPlaylist(pl._id, song);
                                          setSongMenuId(null);
                                        }}
                                        className="w-full text-left px-2 py-1 text-[10px] text-gray-350 hover:text-white hover:bg-white/5 rounded-lg truncate block cursor-pointer"
                                      >
                                        + {pl.name}
                                      </button>
                                    ))
                                  ) : (
                                    <div className="px-2 py-1.5 text-[9px] text-gray-500 italic">No playlists created</div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* PLAYLISTS TAB */}
          {activeTab === 'playlists' && (
            <motion.div
              key="playlists-tab"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex flex-col gap-4 h-full"
            >
              <div className="flex justify-between items-center bg-slate-950/20 p-1.5 rounded-2xl border border-white/5 shrink-0">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono pl-2">
                  My Library
                </span>
                <button
                  onClick={() => setShowCreateInput(!showCreateInput)}
                  className="flex items-center gap-1 bg-gradient-to-r from-emerald-500/10 to-purple-500/10 border border-white/10 hover:border-emerald-500/30 text-white rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition-all cursor-pointer hover-glow-purple"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-emerald-450" /> Create
                </button>
              </div>

              {showCreateInput && (
                <form onSubmit={handleCreatePlaylist} className="flex gap-1.5 bg-slate-950/40 p-2 rounded-2xl border border-white/5">
                  <input
                    type="text"
                    placeholder="New Playlist Name..."
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="flex-1 bg-slate-900/60 border border-white/5 rounded-xl px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-purple-500/50"
                    autoFocus
                  />
                  <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3 py-1.5 rounded-xl text-[10px] cursor-pointer">
                    Save
                  </button>
                </form>
              )}

              {/* LIST PLAYLISTS */}
              {!selectedPlaylistId ? (
                <div className="space-y-2.5">
                  {playlists.length === 0 ? (
                    <div className="py-12 text-center text-xs text-gray-500 italic">No playlists created yet. Click "Create" to build one!</div>
                  ) : (
                    playlists.map(pl => (
                      <div
                        key={pl._id}
                        className="group flex items-center justify-between p-3 bg-slate-900/30 border border-white/5 rounded-2xl hover:bg-slate-900/70 hover:border-purple-500/20 transition-all card-transition cursor-pointer"
                        onClick={() => setSelectedPlaylistId(pl._id)}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-white/5 flex items-center justify-center text-purple-450 shrink-0">
                            <ListMusic className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            {isEditingPlaylistId === pl._id ? (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={renameInput}
                                  onChange={(e) => setRenameInput(e.target.value)}
                                  className="bg-slate-950 border border-white/10 text-xs text-white rounded-lg px-2 py-0.5 w-full focus:outline-none"
                                  autoFocus
                                />
                                <button onClick={() => handleRenamePlaylist(pl._id)} className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded-md">OK</button>
                              </div>
                            ) : (
                              <>
                                <div className="text-xs font-bold text-gray-200 truncate group-hover:text-white">{pl.name}</div>
                                <div className="text-[9px] text-gray-500 font-mono mt-0.5 uppercase tracking-wider">{pl.songs.length} Track{pl.songs.length !== 1 ? 's' : ''}</div>
                              </>
                            )}
                          </div>
                        </div>

                        {isEditingPlaylistId !== pl._id && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setIsEditingPlaylistId(pl._id);
                                setRenameInput(pl.name);
                              }}
                              className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
                              title="Rename Playlist"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deletePlaylist(pl._id)}
                              className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-rose-500"
                              title="Delete Playlist"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* SELECTED PLAYLIST TRACK DETAILS */
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <button
                      onClick={() => setSelectedPlaylistId(null)}
                      className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 font-mono uppercase tracking-wider cursor-pointer"
                    >
                      &larr; Back to Lists
                    </button>
                    {selectedPlaylist && selectedPlaylist.songs.length > 0 && (
                      <button
                        onClick={() => playPlaylist(selectedPlaylist.songs)}
                        className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white rounded-xl px-3 py-1 text-[10px] font-bold transition-all cursor-pointer hover-glow-purple shadow-md"
                      >
                        <Play className="w-3 h-3 text-slate-950 fill-slate-950" /> Play All
                      </button>
                    )}
                  </div>

                  <div className="text-xs font-black text-gray-300 px-1 truncate bg-slate-950/20 py-1 rounded-lg">
                    📖 Playlist: <span className="text-purple-400">{selectedPlaylist?.name}</span>
                  </div>

                  <div className="space-y-2">
                    {selectedPlaylist?.songs.length === 0 ? (
                      <div className="py-8 text-center text-xs text-gray-500 italic">Playlist is empty. Add songs from the Search tab.</div>
                    ) : (
                      selectedPlaylist?.songs.map(song => (
                        <div
                          key={song.id}
                          className="group flex items-center justify-between p-2 bg-slate-900/30 border border-white/5 rounded-xl hover:bg-slate-900/70 transition-all cursor-pointer"
                          onClick={() => playSong(song)}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="text-xs font-bold text-gray-200 truncate group-hover:text-white">{song.title}</div>
                            <div className="text-[9px] text-gray-400 truncate mt-0.5">{song.artist}</div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => addToQueue(song)}
                              className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-450 text-[9px] font-bold cursor-pointer"
                              title="Add to Queue"
                            >
                              + Queue
                            </button>
                            <span className="text-[9px] text-gray-500 font-mono">{formatDuration(song.duration)}</span>
                            <button
                              onClick={() => removeSongFromPlaylist(selectedPlaylist._id, song.id)}
                              className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-rose-500 transition-colors cursor-pointer"
                              title="Remove Song"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* FAVORITES (LIKED SONGS) */}
          {activeTab === 'favorites' && (
            <motion.div
              key="favorites-tab"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex flex-col gap-3 h-full"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-2 shrink-0">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono pl-1">
                  Liked Songs
                </span>
                {favorites.length > 0 && (
                  <button
                    onClick={() => playPlaylist(favorites)}
                    className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-indigo-600 text-white rounded-xl px-3 py-1 text-[10px] font-bold transition-all cursor-pointer shadow-md hover-glow-purple"
                  >
                    <Play className="w-3 h-3 text-slate-950 fill-slate-950" /> Play Liked
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {favorites.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-500 italic">No liked songs. Click the Heart icon next to any song.</div>
                ) : (
                  favorites.map(song => (
                    <div
                      key={song.id}
                      className="group flex items-center justify-between p-2.5 bg-slate-900/30 border border-white/5 rounded-2xl hover:bg-slate-900/70 hover:border-rose-500/10 transition-all card-transition cursor-pointer"
                      onClick={() => playSong(song)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-gray-200 truncate group-hover:text-white">{song.title}</div>
                        <div className="text-[9px] text-gray-400 truncate mt-0.5">{song.artist}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleFavorite(song)}
                          className="p-1 rounded hover:bg-white/5 text-rose-500 cursor-pointer"
                          title="Unlike"
                        >
                          <Heart className="w-3.5 h-3.5 fill-rose-500" />
                        </button>
                        <button
                          onClick={() => addToQueue(song)}
                          className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer text-xs font-black"
                          title="Queue +"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* HISTORY (RECENTLY & MOST PLAYED) */}
          {activeTab === 'history' && (
            <motion.div
              key="history-tab"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex flex-col gap-4 h-full"
            >
              {/* Recently Played */}
              <div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono border-b border-white/5 pb-2 mb-2">
                  Recently Played
                </div>
                <div className="space-y-2">
                  {recentHistory.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-500 italic">No recently played songs. Play a song first!</div>
                  ) : (
                    recentHistory.slice(0, 10).map((song, idx) => (
                      <div
                        key={`${song.id}_${idx}`}
                        className="group flex items-center justify-between p-2 bg-slate-900/20 border border-white/5 rounded-xl hover:bg-slate-900/60 transition-all cursor-pointer"
                        onClick={() => playSong(song)}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-gray-300 truncate group-hover:text-white">{song.title}</div>
                          <div className="text-[9px] text-gray-500 truncate">{song.artist}</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToQueue(song);
                          }}
                          className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer text-[10px] font-black"
                          title="Add to queue"
                        >
                          +
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Most Played */}
              <div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono border-b border-white/5 pb-2 mb-2 mt-2">
                  Most Played Songs
                </div>
                <div className="space-y-2">
                  {mostPlayed.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-500 italic font-sans">Most played tracking will show here.</div>
                  ) : (
                    mostPlayed.slice(0, 10).map((song, idx) => (
                      <div
                        key={`${song.id}_most_${idx}`}
                        className="group flex items-center justify-between p-2 bg-slate-900/20 border border-white/5 rounded-xl hover:bg-slate-900/60 transition-all cursor-pointer"
                        onClick={() => playSong(song)}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-gray-300 truncate group-hover:text-white">{song.title}</div>
                          <div className="text-[9px] text-gray-500 truncate">{song.artist}</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToQueue(song);
                          }}
                          className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer text-[10px] font-black"
                          title="Add to queue"
                        >
                          +
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
