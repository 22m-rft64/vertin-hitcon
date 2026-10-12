import { Challenge, IChallenge } from './Challenge';

export interface CTFCredentials {
  url: string | null;
  username: string | null;
  password: string | null;
  email: string | null;
  invite: string | null;
  teamToken: string | null;
  _message: string | null;
}

export interface ICTF {
  name: string;
  archived: boolean;
  ended: boolean;
  private: boolean;
  credentials: CTFCredentials;
  challenges: Map<string, Challenge>;
  guild_role: string;
  guild_category: string;
  guild_channels: {
    general: string;
    announcements: string;
    credentials: string;
    scoreboard: string;
    solves: string;
    notes: string;
    botCmds: string;
    feed: string | null;
  };
  pull_ignore: string[];
  flag_format: string | null;
  start_at: Date | null;
  ended_at: Date | null;
  event_id: string;
  join_msg?: string;
  _createdAt: Date;
  _updatedAt: Date;
}

export class CTF implements ICTF {
  name: string;
  archived: boolean;
  ended: boolean;
  private: boolean;
  credentials: CTFCredentials;
  challenges: Map<string, Challenge>;
  guild_role: string;
  guild_category: string;
  guild_channels: {
    general: string;
    announcements: string;
    credentials: string;
    scoreboard: string;
    solves: string;
    notes: string;
    botCmds: string;
    feed: string | null;
  };
  pull_ignore: string[];
  flag_format: string | null;
  start_at: Date | null;
  ended_at: Date | null;
  event_id: string;
  join_msg?: string;
  _createdAt: Date;
  _updatedAt: Date;

  constructor(data: Partial<ICTF>) {
    this.name = data.name || 'Unnamed CTF';
    this.archived = data.archived ?? false;
    this.ended = data.ended ?? false;
    this.private = data.private ?? false;
    this.credentials = data.credentials || {
      url: null,
      username: null,
      password: null,
      email: null,
      invite: null,
      teamToken: null,
      _message: 'No credentials provided.',
    };
    this.challenges = data.challenges || new Map();
    this.guild_role = data.guild_role || '';
    this.guild_category = data.guild_category || '';
    this.guild_channels = data.guild_channels || {
      general: '',
      announcements: '',
      credentials: '',
      scoreboard: '',
      solves: '',
      notes: '',
      botCmds: '',
      feed: null,
    };
    this.pull_ignore = data.pull_ignore || [];
    this.flag_format = data.flag_format ?? null;
    this.start_at = data.start_at ?? null;
    this.ended_at = data.ended_at ?? null;
    this.event_id = data.event_id || '';
    this.join_msg = data.join_msg;
    this._createdAt = data._createdAt || new Date();
    this._updatedAt = data._updatedAt || new Date();
  }

  get year(): number {
    return this.start_at?.getFullYear() ?? new Date().getFullYear();
  }

  toJSON(): Omit<ICTF, 'challenges'> & { challenges: IChallenge[] } {
    return {
      name: this.name,
      archived: this.archived,
      ended: this.ended,
      private: this.private,
      credentials: this.credentials,
      challenges: [...this.challenges.values()].map((ch) => ch.toJSON()),
      guild_role: this.guild_role,
      guild_category: this.guild_category,
      guild_channels: this.guild_channels,
      pull_ignore: this.pull_ignore,
      flag_format: this.flag_format,
      start_at: this.start_at,
      ended_at: this.ended_at,
      event_id: this.event_id,
      join_msg: this.join_msg,
      _createdAt: this._createdAt,
      _updatedAt: this._updatedAt,
    };
  }
}
