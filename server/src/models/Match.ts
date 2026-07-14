import { Schema, model, Document, Types } from 'mongoose';

export interface IMatch extends Document {
  roomId: string;
  game: string;
  players: Types.ObjectId[];
  winner: Types.ObjectId | null; // null represents a draw
  moves: any[];
  duration: number; // in seconds
  createdAt: Date;
}

const matchSchema = new Schema<IMatch>(
  {
    roomId: {
      type: String,
      required: true,
    },
    game: {
      type: String,
      required: true,
      default: 'tic-tac-toe',
    },
    players: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    winner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for draw
    },
    moves: [Schema.Types.Mixed],
    duration: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Match = model<IMatch>('Match', matchSchema);
