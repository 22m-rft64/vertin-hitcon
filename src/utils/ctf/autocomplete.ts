import { CHALLENGE_CATEGORIES, CATEGORY_ALIASES } from "@core/models/Category";
import { VertinClient } from "@discordutils/vertinclient";
import { AutocompleteInteraction, ChannelType } from "discord.js";
import { isErr } from "@discordtypes/result";

// canonical + alias keys를 한 번만 계산
export const CATEGORY_CHOICES: { name: string; value: string }[] = (() => {
  const seen = new Set<string>();
  const choices: { name: string; value: string }[] = [];

  // canonical 카테고리 우선
  for (const cat of CHALLENGE_CATEGORIES) {
    if (!seen.has(cat)) {
      seen.add(cat);
      choices.push({ name: cat, value: cat });
    }
  }

  // alias → canonical (alias를 name으로 보여주되, value는 canonical)
  for (const [alias, canonical] of CATEGORY_ALIASES) {
    if (alias === canonical) continue;
    const label = `${alias} → ${canonical}`;
    if (!seen.has(label)) {
      seen.add(label);
      choices.push({ name: label, value: canonical });
    }
  }

  return choices;
})();

/*
 * Autocompletion Function : params (client: VertinClient, interaction: AutocompleteInteraction)
 */

export const ActivatedCTFName = async (
  client: VertinClient,
  interaction: AutocompleteInteraction,
): Promise<void> => {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  const activeCTFs = client.ctfService.listActiveCTFs();

  const autocompletion = activeCTFs
    .filter((ctf) => ctf.name.toLowerCase().includes(focusedValue))
    .slice(0, 25)
    .map((ctf) => ({ name: ctf.name, value: ctf.name }));
  await interaction.respond(autocompletion);
};

// load from db
export const AllCTFName = async (
  client: VertinClient,
  interaction: AutocompleteInteraction,
): Promise<void> => {};

export const ChallengeAutocompletion = async (
  client: VertinClient,
  interaction: AutocompleteInteraction,
): Promise<void> => {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  const ctfResult = await client.ctfService.getCTF({
    guild_category: [
      ChannelType.GuildPrivateThread,
      ChannelType.GuildPublicThread,
    ].includes(interaction.channel.type)
      ? interaction.channel.parent.parentId
      : interaction.channel.parentId,
  });

  if (isErr(ctfResult) || !ctfResult.value) {
    return;
  }
  const ctf = ctfResult.value;

  const autocompletion = Array.from(ctf.challenges.values())
    .filter((chall) => chall.name.toLowerCase().includes(focusedValue))
    .sort((a, b) => {
      if (a.solved === b.solved) return 0;
      return a.solved ? 1 : -1;
    })
    .slice(0, 25)
    .map((chall) => ({
      name: `${chall.solved ? "✔️" : "❌"} - ${chall.name} (${chall.category})`,
      value: chall.name,
    }));

  await interaction.respond(autocompletion);
};

export const ChallengeCategoryAutocompletion = async (
  _client: VertinClient,
  interaction: AutocompleteInteraction,
): Promise<void> => {
  const focusedValue = interaction.options.getFocused().toLowerCase();

  const filtered = CATEGORY_CHOICES
    .filter((c) => c.name.toLowerCase().includes(focusedValue))
    .slice(0, 25);

  await interaction.respond(filtered);
};
