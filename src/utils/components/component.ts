import { VertinClient } from '@discordutils/vertinclient';
import {
  ButtonInteraction,
  ModalSubmitInteraction,
  AnySelectMenuInteraction,
  UserSelectMenuBuilder,
  RoleSelectMenuBuilder,
  MentionableSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { ButtonModel } from '@adapters/mongo/schemas/button';

export type AnySelectMenuBuilder =
  | UserSelectMenuBuilder
  | RoleSelectMenuBuilder
  | MentionableSelectMenuBuilder
  | ChannelSelectMenuBuilder
  | StringSelectMenuBuilder;

export type ComponentInteraction =
  | ButtonInteraction
  | ModalSubmitInteraction
  | AnySelectMenuInteraction;

export interface ComponentInit {
  readonly client: VertinClient;
  readonly attachId: string;
  readonly timeout?: number | null;
}

export abstract class Component<I extends ComponentInteraction> {
  static actionName: string;
  readonly customId: string;
  protected readonly client: VertinClient;
  protected readonly attachId: string;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(init: ComponentInit) {
    this.client = init.client;
    this.attachId = init.attachId;

    const clazz = this.constructor as typeof Component;
    if (!clazz.actionName) {
      throw new Error(`[${clazz.name}] missing static actionName`);
    }

    this.customId = `${clazz.actionName}::${init.attachId}`;

    this.client.componentRegistry.register(this.customId, this as Component<ComponentInteraction>);

    if (init.timeout != null && init.timeout > 0) {
      this.setupTimeout(init.timeout);
    }
  }

  abstract execute(interaction: I): Promise<void>;

  /**
   * DB에 영속 저장 (봇 재시작 시 복원 대상)
   * upsert로 중복 키 에러 방지
   */
  async persist(): Promise<void> {
    const clazz = this.constructor as typeof Component;
    await ButtonModel.updateOne(
      { customId: this.customId },
      {
        $set: {
          actionName: clazz.actionName,
          attachId: this.attachId,
        },
        $setOnInsert: {
          customId: this.customId,
        },
      },
      { upsert: true },
    );
  }

  /**
   * DB에서 영속 레코드 삭제
   */
  async unpersist(): Promise<void> {
    await ButtonModel.deleteOne({ customId: this.customId });
  }

  /**
   * actionName 기준으로 일괄 삭제 (CTF 삭제/아카이브 시 사용)
   */
  static async unpersistByAction(actionName: string, attachId?: string): Promise<number> {
    const query: Record<string, string> = { actionName };
    if (attachId !== undefined) {
      query.attachId = attachId;
    }
    const result = await ButtonModel.deleteMany(query);
    return result.deletedCount;
  }

  protected setupTimeout(seconds: number): void {
    this.cancelTimeout();
    this.timeoutId = setTimeout(() => this.dispose(), seconds * 1e3);
  }

  protected cancelTimeout(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  dispose(): void {
    this.client.componentRegistry.unregister(this.customId);
    this.cancelTimeout();
  }
}
