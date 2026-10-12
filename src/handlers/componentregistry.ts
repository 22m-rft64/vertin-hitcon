import {
  ButtonInteraction,
  MessageFlags,
  ModalSubmitInteraction,
  AnySelectMenuInteraction,
} from 'discord.js';
import { VertinClient } from '@discordutils/vertinclient';
import { createLogger } from '@discordutils/logger';
import { ButtonModel } from '@adapters/mongo/schemas/button';
import { t, resolveLocale } from '@i18n/index';

const log = createLogger('ComponentRegistry');

export type ComponentInteraction =
  | ButtonInteraction
  | ModalSubmitInteraction
  | AnySelectMenuInteraction;

/** Factory는 복원 성공 시 true, 대상을 찾지 못하면 false 반환 */
export type ComponentFactory = (
  client: VertinClient,
  attachId: string,
) => Promise<boolean>;

export interface RegisteredHandler {
  execute(interaction: ComponentInteraction): Promise<void>;
  dispose(): void;
}

export class ComponentRegistry {
  private readonly handlers = new Map<string, RegisteredHandler>();
  private readonly factories = new Map<string, ComponentFactory>();

  register(customId: string, handler: RegisteredHandler): void {
    this.handlers.get(customId)?.dispose();
    this.handlers.set(customId, handler);
  }

  unregister(customId: string): void {
    this.handlers.delete(customId);
  }

  get(customId: string): RegisteredHandler | undefined {
    return this.handlers.get(customId);
  }

  async dispatch(interaction: ComponentInteraction): Promise<void> {
    const handler = this.handlers.get(interaction.customId);
    if (!handler) {
      if (interaction.isModalSubmit()) return;
      const lang = resolveLocale(interaction.locale);
      await interaction.reply({
        content: t('error.unknown_component', lang),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    try {
      await handler.execute(interaction);
    } catch (error) {
      log.error('Component %s error', interaction.customId, error);
      const canReply = !interaction.replied && !interaction.deferred;
      if (canReply) {
        const lang = resolveLocale(interaction.locale);
        await interaction.reply({
          content: t('error.unexpected', lang),
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      }
    }
  }

  registerFactory(actionName: string, factory: ComponentFactory): void {
    this.factories.set(actionName, factory);
  }

  async restoreFromDB(client: VertinClient): Promise<void> {
    const buttons = await ButtonModel.find({});
    log.info('Found %d persistent component(s) in DB', buttons.length);

    const orphanIds: string[] = [];

    for (const button of buttons) {
      let { actionName, attachId } = button;

      // Legacy records only have customId — parse structured fields from it
      if (!actionName) {
        const separatorIdx = button.customId.indexOf('::');
        if (separatorIdx === -1) {
          orphanIds.push(button.customId);
          continue;
        }
        actionName = button.customId.slice(0, separatorIdx);
        attachId = button.customId.slice(separatorIdx + 2);
      }

      const factory = this.factories.get(actionName);

      if (!factory) {
        orphanIds.push(button.customId);
        continue;
      }

      const restored = await factory(client, attachId);
      if (!restored) {
        orphanIds.push(button.customId);
      } else if (!button.actionName) {
        // Backfill structured fields on legacy records
        await ButtonModel.updateOne(
          { customId: button.customId },
          { $set: { actionName, attachId } },
        );
      }
    }

    if (orphanIds.length > 0) {
      await ButtonModel.deleteMany({ customId: { $in: orphanIds } });
      log.info('Cleaned %d orphaned DB entries', orphanIds.length);
    }

    log.info('Component restore complete. %d handlers active', this.handlers.size);
  }

  get size(): number {
    return this.handlers.size;
  }
}
