import mongoose, { Document, Schema } from "mongoose";

export interface CTFMemberDocument extends Document {
  id: string; // Discord ID
  username: string;
  globalname: string;
  nickname: string | null;
  avatar_url_guild: string | null;
  avatar_url: string;
  joined_at: Date;
  updated_at: Date;

  toJSON(): Omit<CTFMemberDocument, keyof Document | 'toJSON'>;
}

const CTFMemberSchema = new Schema<CTFMemberDocument>(
  {
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    globalname: { type: String, default: "" },
    nickname: { type: String, default: null },
    avatar_url_guild: { type: String, default: null },
    avatar_url: { type: String, required: true },
    joined_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: {
      createdAt: "joined_at",
      updatedAt: "updated_at",
    },
  },
);

CTFMemberSchema.index({ username: 1 });

CTFMemberSchema.virtual("displayName").get(function () {
  return this.nickname || this.globalname || this.username;
});

CTFMemberSchema.virtual("displayAvatar").get(function () {
  return this.avatar_url_guild || this.avatar_url;
});

CTFMemberSchema.methods.toJSON = function () {
  return {
    id: this.id,
    username: this.username,
    globalname: this.globalname,
    nickname: this.nickname,
    avatar_url_guild: this.avatar_url_guild,
    avatar_url: this.avatar_url,
    joined_at: this.joined_at,
    updated_at: this.updated_at,
  };
};

export const CTFMemberModel = mongoose.model<CTFMemberDocument>(
  "CTFMember",
  CTFMemberSchema,
);
