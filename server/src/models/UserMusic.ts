import { Schema, model, Document } from 'mongoose';

export interface ISong {
  id: string; // iTunes trackId
  title: string;
  artist: string;
  album: string;
  duration: number; // in milliseconds
  previewUrl: string;
  artworkUrl100?: string;
}

export interface IPlaylist extends Document {
  userId: Schema.Types.ObjectId;
  name: string;
  songs: ISong[];
  artworkUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMusicPreference extends Document {
  userId: Schema.Types.ObjectId;
  favorites: ISong[];
  history: Array<ISong & { playedAt: Date }>;
  playCounts: Array<{
    songId: string;
    count: number;
    song: ISong;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const SongSchema = new Schema<ISong>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  artist: { type: String, required: true },
  album: { type: String },
  duration: { type: Number, required: true },
  previewUrl: { type: String, required: true },
  artworkUrl100: { type: String },
});

const PlaylistSchema = new Schema<IPlaylist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    songs: { type: [SongSchema], default: [] },
    artworkUrl: { type: String },
  },
  { timestamps: true }
);

const UserMusicPreferenceSchema = new Schema<IUserMusicPreference>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    favorites: { type: [SongSchema], default: [] },
    history: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        artist: { type: String, required: true },
        album: { type: String },
        duration: { type: Number, required: true },
        previewUrl: { type: String, required: true },
        artworkUrl100: { type: String },
        playedAt: { type: Date, default: Date.now },
      },
    ],
    playCounts: [
      {
        songId: { type: String, required: true },
        count: { type: Number, default: 1 },
        song: { type: SongSchema, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const Playlist = model<IPlaylist>('Playlist', PlaylistSchema);
export const UserMusicPreference = model<IUserMusicPreference>('UserMusicPreference', UserMusicPreferenceSchema);
