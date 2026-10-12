export interface ICTFMember {
  id: string;
  username: string;
  globalname: string;
  nickname: string | null;
  avatar_url_guild: string | null;
  avatar_url: string;
  joined_at: Date;
  updated_at: Date;
}

export class CTFMember implements ICTFMember {
  id: string;
  username: string;
  globalname: string;
  nickname: string | null;
  avatar_url_guild: string | null;
  avatar_url: string;
  joined_at: Date;
  updated_at: Date;

  constructor(data: Partial<ICTFMember>) {
    this.id = data.id || '';
    this.username = data.username || '';
    this.globalname = data.globalname || '';
    this.nickname = data.nickname || null;
    this.avatar_url_guild = data.avatar_url_guild || null;
    this.avatar_url = data.avatar_url || '';
    this.joined_at = data.joined_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  displayName(): string {
    return this.nickname || this.globalname || this.username;
  }

  displayAvatar(): string {
    return this.avatar_url_guild || this.avatar_url;
  }

  toJSON(): ICTFMember {
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
  }
}
