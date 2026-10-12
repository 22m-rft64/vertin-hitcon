import mongoose, { Document, Schema } from "mongoose";

interface ChallengeSubDocument {
  _id: string;
  platform_id: string | null;
  slug: string | null;
  name: string;
  category: string;
  raw_category: string | null;
  thread: string;
  players: string[];
  idleWorkers: string[];
  announcement: string;
  workon_message: string | null;
  solved: boolean;
  blooded: boolean;
  solve_time: Date | null;
  solve_announcement: string | null;
  solver: string | null;
  contributors: string[];
  solvers: string[];
  flag: string | null;
  _createdAt: Date;
  _updatedAt: Date;
}

interface CTFCredentialsSubDocument {
  url: string | null;
  username: string | null;
  password: string | null;
  email: string | null;
  invite: string | null;
  teamToken: string | null;
  _message: string | null;
}

interface CTFGuildChannelsSubDocument {
  general: string;
  announcements: string;
  credentials: string;
  scoreboard: string;
  solves: string;
  notes: string;
  botCmds: string;
  feed: string | null;
}

export interface CTFDocument extends Document {
  name: string;
  archived: boolean;
  ended: boolean;
  private: boolean;
  credentials: CTFCredentialsSubDocument;
  challenges: ChallengeSubDocument[];
  guild_role: string;
  guild_category: string;
  guild_channels: CTFGuildChannelsSubDocument;
  pull_ignore: string[];
  start_at: Date;
  ended_at: Date | null;
  event_id: string;
  join_msg?: string;
  createdAt: Date;
  updatedAt: Date;
}

//schemas
const ChallengeSchema = new Schema(
  {
    _id: { type: String, required: true },
    platform_id: { type: String, default: null },
    slug: { type: String, default: null },
    name: { type: String, required: true },
    category: { type: String, required: true },
    raw_category: { type: String, default: null },
    thread: { type: String, required: true },
    players: { type: [String], default: [] },
    idleWorkers: { type: [String], default: [] },
    announcement: { type: String, default: null },
    workon_message: { type: String, default: null },
    solved: { type: Boolean, default: false },
    blooded: { type: Boolean, default: false },
    solve_time: { type: Date, default: null },
    solve_announcement: { type: String, default: null },
    solver: { type: String, default: null },
    contributors: { type: [String], default: [] },
    solvers: { type: [String], default: [] },
    flag: { type: String, default: null },
    _createdAt: { type: Date, default: Date.now },
    _updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const CTFCredentialsSchema = new Schema(
  {
    url: { type: String, default: null },
    username: { type: String, default: null },
    password: { type: String, default: null },
    email: { type: String, default: null },
    invite: { type: String, default: null },
    teamToken: { type: String, default: null },
    _message: { type: String, default: "No credentials provided." },
  },
  { _id: false },
);

const CTFGuildChannelsSchema = new Schema(
  {
    general: { type: String, default: "" },
    announcements: { type: String, default: "" },
    credentials: { type: String, default: "" },
    scoreboard: { type: String, default: "" },
    solves: { type: String, default: "" },
    notes: { type: String, default: "" },
    botCmds: { type: String, default: "" },
    feed: { type: String, default: null },
  },
  { _id: false },
);

const CTFSchema = new Schema<CTFDocument>(
  {
    name: { type: String, required: true },
    archived: { type: Boolean, default: false },
    ended: { type: Boolean, default: false },
    private: { type: Boolean, default: false },
    credentials: {
      type: CTFCredentialsSchema,
      default: () => ({
        url: null,
        username: null,
        password: null,
        email: null,
        invite: null,
        teamToken: null,
        _message: "No credentials provided.",
      }),
    },
    challenges: { type: [ChallengeSchema], default: [] },
    guild_role: { type: String, default: "" },
    guild_category: { type: String, default: "" },
    guild_channels: {
      type: CTFGuildChannelsSchema,
      default: () => ({
        general: "",
        announcements: "",
        credentials: "",
        scoreboard: "",
        solves: "",
        notes: "",
        botCmds: "",
        feed: null,
      }),
    },
    pull_ignore: { type: [String], default: [] },
    start_at: { type: Date, default: Date.now },
    ended_at: { type: Date, default: null },
    event_id: { type: String, required: true, unique: true },
    join_msg: { type: String, default: "", unique: false },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },
);

// 인덱스 추가
CTFSchema.index({ name: 1 });
CTFSchema.index({ "challenges.name": 1 });
CTFSchema.index({ "challenges.category": 1 });

// toJSON 메서드 오버라이드하여 모델의 toJSON과 일치시키기
CTFSchema.methods.toJSON = function () {
  const obj = this.toObject();
  return {
    name: obj.name,
    archived: obj.archived,
    ended: obj.ended,
    private: obj.private,
    credentials: obj.credentials,
    challenges: obj.challenges,
    guild_role: obj.guild_role,
    guild_category: obj.guild_category,
    guild_channels: obj.guild_channels,
    pull_ignore: obj.pull_ignore,
    event_id: obj.event_id,
    join_msg: obj.join_msg,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

export const CTFModel = mongoose.model<CTFDocument>("CTF", CTFSchema);
