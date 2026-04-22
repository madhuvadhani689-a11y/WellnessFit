import { useState, useEffect } from "react";
import "./MoodMusicPlayer.css";

const MOODS = [
  { id: "calm", label: "Calm", icon: "😌" },
  { id: "focus", label: "Focus", icon: "🎯" },
  { id: "energy", label: "Energy", icon: "⚡" },
  { id: "sleep", label: "Sleep", icon: "🌙" },
];

const SONGS = [
  // Calm
  { id: 1, title: "Weightless", artist: "Marconi Union", mood: "calm", language: "English", youtubeId: "UfcAVejslrU" },
  { id: 2, title: "Yellow", artist: "Coldplay", mood: "calm", language: "English", youtubeId: "yKNxeF4KMsY" },
  { id: 3, title: "Clair de Lune", artist: "Claude Debussy", mood: "calm", language: "English", youtubeId: "CvFH_6DNRCY" },
  { id: 4, title: "Someone Like You", artist: "Adele", mood: "calm", language: "English", youtubeId: "hLQl3WQQoQ0" },
  { id: 5, title: "Lofi Beats", artist: "Lofi Girl", mood: "calm", language: "English", youtubeId: "jfKfPfyJRdk" },
  { id: 6, title: "Nenjukkul Peidhidum", artist: "Harris Jayaraj", mood: "calm", language: "Tamil", youtubeId: "rAybxV_QG6Q" },
  { id: 7, title: "Munbe Vaa", artist: "A.R. Rahman", mood: "calm", language: "Tamil", youtubeId: "KzW0dIKT2C4" },
  { id: 8, title: "Vennilave Vennilave", artist: "A.R. Rahman", mood: "calm", language: "Tamil", youtubeId: "wP336wJmlyA" },
  { id: 9, title: "Mazhai Kuruvi", artist: "A.R. Rahman", mood: "calm", language: "Tamil", youtubeId: "XlM9-b6kEAE" },
  { id: 10, title: "Kadhal Rojave", artist: "A.R. Rahman", mood: "calm", language: "Tamil", youtubeId: "JzO3n4o0I7U" },

  // Focus
  { id: 11, title: "Numb", artist: "Linkin Park", mood: "focus", language: "English", youtubeId: "kXYiU_JCYtU" },
  { id: 12, title: "Believer", artist: "Imagine Dragons", mood: "focus", language: "English", youtubeId: "7wtfhZwyrcc" },
  { id: 13, title: "Lose Yourself", artist: "Eminem", mood: "focus", language: "English", youtubeId: "_Yhyp-_hX2s" },
  { id: 14, title: "Eye of the Tiger", artist: "Survivor", mood: "focus", language: "English", youtubeId: "btPJPFnesV4" },
  { id: 15, title: "Beethoven Symphony 9", artist: "Beethoven", mood: "focus", language: "English", youtubeId: "t3217H8JppI" },
  { id: 16, title: "Verithanam", artist: "A.R. Rahman", mood: "focus", language: "Tamil", youtubeId: "yXWw0_UfSFg" },
  { id: 17, title: "Surviva", artist: "Anirudh", mood: "focus", language: "Tamil", youtubeId: "p3qA0f0F8y4" },
  { id: 18, title: "Neruppu Da", artist: "Santhosh Narayanan", mood: "focus", language: "Tamil", youtubeId: "LQaOWKEDy8E" },
  { id: 19, title: "Aaluma Doluma", artist: "Anirudh", mood: "focus", language: "Tamil", youtubeId: "_nJInBmbPGo" },
  { id: 20, title: "Vaathi Coming", artist: "Anirudh", mood: "focus", language: "Tamil", youtubeId: "fGcxBwXdcH8" },

  // Energy
  { id: 21, title: "Can't Hold Us", artist: "Macklemore", mood: "energy", language: "English", youtubeId: "2zNSgSzhBfM" },
  { id: 22, title: "Don't Stop Me Now", artist: "Queen", mood: "energy", language: "English", youtubeId: "HgzGwKwLmgM" },
  { id: 23, title: "Stronger", artist: "Kanye West", mood: "energy", language: "English", youtubeId: "PsO6ZnUZI0g" },
  { id: 24, title: "Titanium", artist: "David Guetta", mood: "energy", language: "English", youtubeId: "JRfuAukYTKg" },
  { id: 25, title: "Hall of Fame", artist: "The Script", mood: "energy", language: "English", youtubeId: "mk48xRzuNvA" },
  { id: 26, title: "Aalaporaan Tamizhan", artist: "A.R. Rahman", mood: "energy", language: "Tamil", youtubeId: "f9GZ58E62vI" },
  { id: 27, title: "Ethir Neechal", artist: "Anirudh", mood: "energy", language: "Tamil", youtubeId: "g22rU-yQ_94" },
  { id: 28, title: "Semma Weightu", artist: "Santhosh Narayanan", mood: "energy", language: "Tamil", youtubeId: "A_7jZz_wYg4" },
  { id: 29, title: "Petta Paraak", artist: "Anirudh", mood: "energy", language: "Tamil", youtubeId: "M3K56t_y684" },
  { id: 30, title: "Sodakku", artist: "Anirudh", mood: "energy", language: "Tamil", youtubeId: "xsgJxt7ZGE0" },

  // Sleep
  { id: 31, title: "A Thousand Years", artist: "Christina Perri", mood: "sleep", language: "English", youtubeId: "rtOvBOTyX00" },
  { id: 32, title: "Perfect", artist: "Ed Sheeran", mood: "sleep", language: "English", youtubeId: "2Vv-BfVoq4g" },
  { id: 33, title: "Fix You", artist: "Coldplay", mood: "sleep", language: "English", youtubeId: "k4V3Mo61fJM" },
  { id: 34, title: "All of Me", artist: "John Legend", mood: "sleep", language: "English", youtubeId: "450p7goxZqg" },
  { id: 35, title: "The Night We Met", artist: "Lord Huron", mood: "sleep", language: "English", youtubeId: "wzgHuIGjcCo" },
  { id: 36, title: "Kannaana Kanney", artist: "D. Imman", mood: "sleep", language: "Tamil", youtubeId: "9z_Zioj_8U" },
  { id: 37, title: "Aararo Aariraro", artist: "G.V. Prakash", mood: "sleep", language: "Tamil", youtubeId: "0fD8mHqWwE4" },
  { id: 38, title: "Uyire", artist: "A.R. Rahman", mood: "sleep", language: "Tamil", youtubeId: "D9e3lA_pGkw" },
  { id: 39, title: "Anbendra Mazhaiyile", artist: "A.R. Rahman", mood: "sleep", language: "Tamil", youtubeId: "m2O9W_m5SIs" },
  { id: 40, title: "Enna Satham", artist: "Ilaiyaraaja", mood: "sleep", language: "Tamil", youtubeId: "gK1_8Y9aZGA" }
];

export default function MoodMusicPlayer() {
  const [activeTab, setActiveTab] = useState("calm");
  const [searchQuery, setSearchQuery] = useState("");
  const [playlistIds, setPlaylistIds] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wellnessfit_playlist");
      if (saved) {
        setPlaylistIds(JSON.parse(saved));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const saveToPlaylist = (ids) => {
    setPlaylistIds(ids);
    try {
      localStorage.setItem("wellnessfit_playlist", JSON.stringify(ids));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleToPlaylist = (songId) => {
    if (playlistIds.includes(songId)) {
      saveToPlaylist(playlistIds.filter((id) => id !== songId));
    } else {
      saveToPlaylist([...playlistIds, songId]);
    }
  };

  const openYoutube = (youtubeId) => {
    window.open(`https://www.youtube.com/watch?v=${youtubeId}`, "_blank", "noopener,noreferrer");
  };

  const isPlaylist = activeTab === "playlist";

  const displayedSongs = SONGS.filter((song) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      song.title.toLowerCase().includes(term) ||
      song.artist.toLowerCase().includes(term);

    if (isPlaylist) {
      return playlistIds.includes(song.id) && matchesSearch;
    }
    return song.mood === activeTab && matchesSearch;
  });

  return (
    <div className="mood-player-wrapper">
      <div className="mood-cards-container">
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            className={`mood-card ${activeTab === mood.id ? "active" : ""}`}
            onClick={() => {
              setActiveTab(mood.id);
              setSearchQuery("");
            }}
          >
            <span className="mood-icon">{mood.icon}</span>
            <span className="mood-label">{mood.label}</span>
          </button>
        ))}
        
        <button
          className={`mood-card playlist-card ${activeTab === "playlist" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("playlist");
            setSearchQuery("");
          }}
        >
          <span className="mood-icon">🎵</span>
          <span className="mood-label">
            My Playlist
            {playlistIds.length > 0 && (
              <span className="playlist-badge">{playlistIds.length}</span>
            )}
          </span>
        </button>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search songs or artists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="song-search-input"
        />
      </div>

      <div className="song-list-container">
        {displayedSongs.length > 0 ? (
          displayedSongs.map((song) => (
            <div key={song.id} className="song-row">
              <div className="song-info">
                <div className="song-title">{song.title}</div>
                <div className="song-artist">{song.artist}</div>
              </div>

              <div className="song-actions">
                <div className={`song-language-badge ${song.language.toLowerCase()}`}>
                  {song.language}
                </div>

                <button
                  className="yt-play-btn"
                  onClick={() => openYoutube(song.youtubeId)}
                  title="Play on YouTube"
                >
                  <span className="yt-icon">▶</span> Play
                </button>

                <button
                  className={`playlist-action-btn ${playlistIds.includes(song.id) ? "remove" : "add"}`}
                  onClick={() => toggleToPlaylist(song.id)}
                  title={playlistIds.includes(song.id) ? "Remove from Playlist" : "Add to Playlist"}
                >
                  {playlistIds.includes(song.id) ? "✕" : "➕"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-songs">
            {isPlaylist && playlistIds.length === 0
              ? "Your playlist is empty. Browse moods and click ➕ to add songs!"
              : "No songs found for your search."}
          </div>
        )}
      </div>
    </div>
  );
}
