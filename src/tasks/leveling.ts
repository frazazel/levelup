import { CombatStrategy } from "grimoire-kolmafia";
import {
  chew,
  cliExecute,
  closetAmount,
  getCampground,
  getClanName,
  getDwelling,
  handlingChoice,
  haveEffect,
  isBanished,
  itemAmount,
  myAdventures,
  myBasestat,
  myBuffedstat,
  myClass,
  myHp,
  myLevel,
  myMaxhp,
  myPrimestat,
  mySpleenUse,
  putCloset,
  restoreHp,
  restoreMp,
  runChoice,
  runCombat,
  spleenLimit,
  takeCloset,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
  wait,
} from "kolmafia";
import {
  $class,
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $skill,
  $stat,
  get,
  getBanishedMonsters,
  have,
  Macro,
} from "libram";
import { args } from "../args";
import { Quest } from "./structure";
import { bestFam, chewOrWish, nextUnusedBanishItem, noML, stooperDrunk } from "./utils";

const levelingTurns = 30;

export function LevelingQuest(): Quest {
  return {
    name: "Levelup",
    completed: () => myLevel() >= args.targetlevel || myAdventures() === 0 || stooperDrunk(),
    tasks: [
      {
        name: "Summon Soap Knife",
        ready: () => myBasestat($stat`Muscle`) >= 60,
        completed: () => !have($skill`That's Not a Knife`) || get("_discoKnife"),
        prepare: () => putCloset(itemAmount($item`soap knife`), $item`soap knife`),
        do: () => useSkill($skill`That's Not a Knife`),
        post: () => takeCloset(closetAmount($item`soap knife`), $item`soap knife`),
      },
      {
        name: "Tip the Author", //disabled by default - must manually discover and enable the flag
        ready: () => args.tip,
        completed: () => !have($item`soap knife`),
        do: () => cliExecute(`csend * soap knife to sketchysolid || Thanks for writing levelup!`),
      },
      {
        name: "Whitelist VIP Clan",
        completed: () => !args.clan || getClanName().toLowerCase() === args.clan.toLowerCase(),
        do: () => cliExecute(`/whitelist ${args.clan}`),
      },
      {
        name: "Call Buffy",
        completed: () => !args.buffy || 0 !== haveEffect($effect`Ghostly Shell`),
        prepare: () =>
          $effects`Carlweather's Cantata of Confrontation, The Sonata of Sneakiness, Polka of Plenty, Fat Leon's Phat Loot Lyric`.forEach(
            (ef) => cliExecute(`uneffect ${ef}`)
          ),
        do: (): void => {
          cliExecute(
            `kmail to buffy || ${levelingTurns} Ghostly Shell, Reptilian Fortitude, Empathy of the Newt, Tenacity of the Snapper, Astral Shell, Elemental Saucesphere, Stevedave's Shanty of Superiority, Power Ballad of the Arrowsmith, Aloysius's Antiphon of Aptitude`
          );
          wait(15);
          cliExecute("refresh effects");
        },
      },
      {
        name: "April Shower",
        completed: () => !have($item`Clan VIP Lounge key`) || get("_aprilShower"),
        do: () => cliExecute(`shower ${myPrimestat()}`),
      },
      {
        name: "Game Grid Token",
        completed: () => !have($item`defective Game Grid token`) || get("_defectiveTokenUsed"),
        do: () => use($item`defective Game Grid token`),
      },
      {
        name: "Campaway",
        completed: () =>
          !get("getawayCampsiteUnlocked") ||
          (get("_campAwayCloudBuffs") >= 1 && get("_campAwaySmileBuffs") >= 3),
        do: () => visitUrl("place.php?whichplace=campaway&action=campaway_sky"),
        limit: { tries: 4 },
      },
      {
        name: "NEP Reject Quest",
        ready: () => get("neverendingPartyAlways") && get("_questPartyFair") === "unstarted",
        completed: () => get("_questPartyFair") === "",
        choices: {
          1322: 2,
        },
        do: $location`The Neverending Party`,
      },
      {
        name: "NEP Exp Buff",
        ready: () =>
          get("neverendingPartyAlways") &&
          get("_questPartyFair") !== "unstarted" &&
          have($item`Clara's bell`),
        completed: () => get("_claraBellUsed"),
        choices: {
          1324: () =>
            myPrimestat() === $stat`Muscle` ? 2 : myPrimestat() === $stat`Mysticality` ? 1 : 4,
          1325: 2, // Myst Exp %
          1326: 2, // Mus Exp %
          1328: 2, // Mox Exp %
        },
        prepare: () => use($item`Clara's bell`),
        do: $location`The Neverending Party`,
      },
      {
        name: "Snapper Spleen Exp %",
        completed: () =>
          $effects`HGH-charged, Different Way of Seeing Things, Thou Shant Not Sing`.reduce(
            (a, ef) => a || have(ef),
            false
          ) || mySpleenUse() >= spleenLimit() + 3 - get("currentMojoFilters"),
        do: (): void => {
          switch (myPrimestat()) {
            case $stat`Muscle`:
              chewOrWish($item`vial of humanoid growth hormone`, $effect`HGH-charged`);
              break;
            case $stat`Mysticality`:
              chewOrWish($item`non-Euclidean angle`, $effect`Different Way of Seeing Things`);
              break;
            case $stat`Moxie`:
              chewOrWish($item`Shantix™`, $effect`Thou Shant Not Sing`);
          }
        },
        limit: { tries: Math.ceil(levelingTurns / 20) },
        tracking: "Leveling",
      },
      {
        name: "Inscrutable Gaze",
        completed: () =>
          myClass().primestat !== $stat`Mysticality` ||
          have($effect`Inscrutable Gaze`) ||
          !have($skill`Inscrutable Gaze`),
        do: () => useSkill($skill`Inscrutable Gaze`),
        limit: { tries: Math.ceil(levelingTurns / 10) },
        tracking: "Leveling",
      },
      {
        name: "Abstraction",
        completed: () =>
          $effects`Purpose, Category, Perception`.reduce((a, ef) => a || have(ef), false) ||
          mySpleenUse() >= spleenLimit() + 3 - get("currentMojoFilters"),
        do: (): void => {
          if (mySpleenUse() === spleenLimit()) use(1, $item`mojo filter`);
          chew(
            1,
            myClass().primestat === $stat`Muscle`
              ? $item`abstraction: purpose`
              : myClass().primestat === $stat`Mysticality`
              ? $item`abstraction: category`
              : $item`abstraction: perception`
          );
        },
        limit: { tries: Math.ceil(levelingTurns / 50) },
        tracking: "Leveling",
      },
      {
        name: "Strange Leaflet",
        completed: () => get("leafletCompleted"),
        do: () => cliExecute("leaflet"),
      },
      {
        name: "Frobozz",
        completed: () => getDwelling() === $item`Frobozz Real-Estate Company Instant House (TM)`,
        do: () => use($item`Frobozz Real-Estate Company Instant House (TM)`),
      },
      {
        name: "Bonerdagon Chest",
        completed: () => !have($item`chest of the Bonerdagon`),
        do: () => use($item`chest of the Bonerdagon`),
      },
      {
        name: "Strange Stalagmite",
        completed: () => !have($item`strange stalagmite`) || get("_strangeStalagmiteUsed", false),
        do: () => use($item`strange stalagmite`),
        choices: {
          1491: () =>
            myClass().primestat === $stat`Muscle`
              ? 1
              : myClass().primestat === $stat`Mysticality`
              ? 2
              : 3,
        },
      },
      {
        name: "Bastille Battalion",
        ready: () => have($item`Bastille Battalion control rig`),
        completed: () => get("_bastilleGames") !== 0,
        do: () => cliExecute("bastille mainstat draftsman gesture"),
      },
      {
        name: "Taffy Effects",
        completed: () =>
          $effects`Orange Crusher, Purple Reign, Cinnamon Challenger`.reduce(
            (a, ef) => a || haveEffect(ef) >= 50,
            false
          ),
        do: () => {
          if (myPrimestat() === $stat`Muscle`)
            use(
              Math.ceil((50 - haveEffect($effect`Orange Crusher`)) / 10),
              $item`pulled orange taffy`
            ); //lasts for 10 turns each
          if (myPrimestat() === $stat`Mysticality`)
            use(
              Math.ceil((50 - haveEffect($effect`Purple Reign`)) / 10),
              $item`pulled violet taffy`
            ); //lasts for 10 turns each
          if (myPrimestat() === $stat`Moxie`)
            use(
              Math.ceil((50 - haveEffect($effect`Cinnamon Challenger`)) / 10),
              $item`pulled red taffy`
            ); //lasts for 10 turns each
        },
        limit: { tries: Math.ceil(levelingTurns / 10) },
        tracking: "Leveling",
      },
      {
        name: "Curiosity",
        completed: () =>
          have($effect`Curiosity of Br'er Tarrypin`) || !have($skill`Curiosity of Br'er Tarrypin`),
        do: () => useSkill($skill`Curiosity of Br'er Tarrypin`),
        limit: { tries: Math.ceil(levelingTurns / 10) },
        tracking: "Leveling",
      },
      {
        name: "Ghost Dog Chow",
        completed: () => myLevel() >= 8 || $familiar`Grey Goose`.experience > 380,
        prepare: () => useFamiliar($familiar`Grey Goose`),
        do: () =>
          use(Math.floor((400 - $familiar`Grey Goose`.experience) / 20), $item`Ghost Dog Chow`),
        tracking: "Leveling",
      },
      {
        name: "Restore HP",
        completed: () => myHp() > 0.5 * myMaxhp(),
        do: () => restoreHp(0.95 * myMaxhp()),
        tracking: "Leveling",
      },
      {
        name: "Cast Blood Bubble",
        completed: () => !have($skill`Blood Bubble`) || have($effect`Blood Bubble`),
        do: () => useSkill($skill`Blood Bubble`),
        tracking: "Leveling",
      },
      {
        name: "Implement Glitch",
        ready: () => have($item`[glitch season reward name]`),
        completed: () => get("_glitchItemImplemented"),
        do: () => use($item`[glitch season reward name]`),
      },
      {
        name: "Fight Glitch",
        ready: () => have($item`[glitch season reward name]`),
        completed: () => get("_glitchMonsterFights") > 0,
        acquire: [
          ...$items`gas can, gas balloon, shard of double-ice`.map((it) => ({
            item: it,
            price: 1000,
          })),
          ...(have($item`January's Garbage Tote`)
            ? [{ item: $item`makeshift garbage shirt` }]
            : []),
        ],
        prepare: () => restoreHp(0.9 * myHp()),
        do: () => visitUrl("inv_eat.php?pwd&whichitem=10207"),
        post: () => {
          if (!get("_lastCombatWon"))
            throw new Error("Lost Combat - Check to see what went wrong.");
        },
        outfit: () => ({
          familiar: bestFam(),
          ...(have($item`January's Garbage Tote`) && have($skill`Torso Awareness`)
            ? { shirt: $item`makeshift garbage shirt` }
            : {}),
          modifier: `${myPrimestat()} experience, 5 ${myPrimestat()} experience percent, 10 familiar experience, ${noML()}`,
        }),
        combat: new CombatStrategy().macro(() =>
          Macro.tryItem($item`gas balloon`)
            .trySkill($skill`Feel Pride`)
            .tryItem(...$items`shard of double-ice, gas can`)
            .attack()
            .repeat()
        ),
        tracking: "Leveling",
      },
      {
        name: "Drunk Pygmies",
        ready: () =>
          !!$effects`HGH-charged, Different Way of Seeing Things, Thou Shant Not Sing`.find((ef) =>
            have(ef)
          ),
        completed: () =>
          get("_drunkPygmyBanishes") >= 11 &&
          !get("crystalBallPredictions").includes($monster`drunk pygmy`.name),
        acquire: [
          { item: $item`Bowl of Scorpions`, price: 1000 },
          ...($monsters`pygmy orderlies, pygmy bowler`.find((mob) => !isBanished(mob))
            ? [{ item: nextUnusedBanishItem(), price: 20000 }]
            : []),
        ],
        effects: $effects`Heart of White`,
        outfit: () => ({
          familiar: $familiar`Grey Goose`,
          ...(have($item`cursed magnifying glass`) && $familiar`Grey Goose`.experience < 400
            ? { offhand: $item`cursed magnifying glass` }
            : {}),
          ...(have($item`miniature crystal ball`) && get("_drunkPygmyBanishes") >= 10
            ? { famequip: $item`miniature crystal ball` }
            : {}),
          ...(have($item`mafia middle finger ring`) &&
          myBasestat($stat`Muscle`) >= 45 &&
          !get("_mafiaMiddleFingerRingUsed")
            ? { equip: [$item`mafia middle finger ring`] }
            : {}),
          modifier: `${myPrimestat()} experience, 5 ${myPrimestat()} experience percent, 10 familiar experience`,
        }),
        prepare: (): void => {
          restoreMp(50);
          if (itemAmount($item`bowling ball`) > 0)
            putCloset(itemAmount($item`bowling ball`), $item`bowling ball`);
        },
        do: $location`The Hidden Bowling Alley`,
        combat: new CombatStrategy()
          .macro(
            () =>
              Macro.externalIf(
                $familiar`Grey Goose`.experience >= 400,
                Macro.trySkill(
                  myPrimestat() === $stat`Muscle`
                    ? $skill`Convert Matter to Protein`
                    : myPrimestat() === $stat`Mysticality`
                    ? $skill`Convert Matter to Energy`
                    : $skill`Convert Matter to Pomade`
                )
              ),
            $monsters`void slab, void guy, void spider, drunk pygmy`
          )
          .macro(
            () =>
              Macro.trySkill($skill`Show them your ring`)
                .externalIf(
                  have($skill`Snokebomb`) && !getBanishedMonsters().get($skill`Snokebomb`),
                  Macro.trySkill($skill`Snokebomb`)
                )
                .externalIf(
                  have($skill`Feel Hatred`) && !getBanishedMonsters().get($skill`Feel Hatred`),
                  Macro.trySkill($skill`Feel Hatred`)
                )
                .tryItem(nextUnusedBanishItem()),
            $monsters`pygmy bowler, pygmy orderlies, pygmy janitor`
          )
          .macro(
            Macro.tryItem($item`porquoise-handled sixgun`)
              .tryItem($item`spectre scepter`)
              .attack()
              .repeat()
          ),
        limit: { tries: 15 },
        tracking: "Leveling",
      },
      {
        name: "Ball Pit",
        completed: () => !have($item`Clan VIP Lounge key`) || get("_ballpit"),
        do: () => cliExecute(`ballpit`),
        tracking: "Leveling",
      },
      {
        name: "Get Lyle Favored",
        completed: () => get("_lyleFavored"),
        do: () => cliExecute("monorail"),
        tracking: "Leveling",
      },
      {
        name: "Telescope Buff",
        completed: () =>
          !($item`Discount Telescope Warehouse gift certificate`.name in getCampground()) ||
          get("telescopeLookedHigh"),
        do: () => cliExecute("telescope high"),
        tracking: "Leveling",
      },
      {
        name: "Fight Seals",
        ready: () =>
          have($item`figurine of a wretched-looking seal`) && have($item`seal-blubber candle`),
        completed: () =>
          myClass() !== $class`Seal Clubber` ||
          get("_sealsSummoned") >= 10 ||
          (!have($item`Claw of the Infernal Seal`) && get("_sealsSummoned") >= 5),
        outfit: () => ({
          familiar: $familiar`Grey Goose`,
          modifier: `club, 0.125 ${myPrimestat()}, ${myPrimestat()} experience, 5 ${myPrimestat()} experience percent, 10 familiar experience`,
        }),
        do: () => visitUrl("inv_use.php?pwd&checked=1&whichitem=3902"),
        combat: new CombatStrategy().macro(() =>
          Macro.externalIf(
            $familiar`Grey Goose`.experience >= 400,
            Macro.trySkill(
              myPrimestat() === $stat`Muscle`
                ? $skill`Convert Matter to Protein`
                : myPrimestat() === $stat`Mysticality`
                ? $skill`Convert Matter to Energy`
                : $skill`Convert Matter to Pomade`
            )
          )
            .trySkill($skill`Sing Along`)
            .tryItem($item`porquoise-handled sixgun`)
            .attack()
            .repeat()
        ),
        limit: { tries: 10 },
        tracking: "Leveling",
      },
      {
        name: "Oliver's Place",
        ready: () => get("ownsSpeakeasy", false),
        completed: () => get("_speakeasyFreeFights", 0) >= 3,
        outfit: () => ({
          familiar: $familiar`Grey Goose`,
          modifier: `${myPrimestat()} experience, 5 ${myPrimestat()} experience percent, 10 familiar experience`,
        }),
        prepare: () => {
          restoreHp(0.9 * myHp());
          restoreMp(12);
        },
        do: $location`An Unusually Quiet Barroom Brawl`,
        post: () => {
          if (!get("_lastCombatWon"))
            throw new Error("Lost Combat - Check to see what went wrong.");
        },
        combat: new CombatStrategy().macro(() =>
          Macro.externalIf(
            $familiar`Grey Goose`.experience >= 400,
            Macro.trySkill(
              myPrimestat() === $stat`Muscle`
                ? $skill`Convert Matter to Protein`
                : myPrimestat() === $stat`Mysticality`
                ? $skill`Convert Matter to Energy`
                : $skill`Convert Matter to Pomade`
            )
          )
            .trySkill($skill`Sing Along`)
            .tryItem($item`porquoise-handled sixgun`)
            .trySkill($skill`Saucestorm`)
            .trySkill($skill`Saucestorm`)
            .attack()
            .repeat()
        ),
        tracking: "Leveling",
        limit: { tries: 3 },
      },
      {
        name: "Buff Mainstat",
        completed: () => myBuffedstat(myPrimestat()) >= 11 * myBasestat(myPrimestat()),
        effects: $effects`Trivia Master`,
        do: () => cliExecute(`gain ${11 * myBasestat(myPrimestat())} ${myPrimestat()}`),
        limit: { tries: levelingTurns },
        tracking: "Leveling",
      },
      {
        name: "Fight Tentacle",
        completed: () => get("_eldritchTentacleFought"),
        acquire: () => [
          ...(have($skill`Curse of Weaksauce`)
            ? []
            : [{ item: $item`electronics kit`, price: 500 }]),
        ],
        outfit: () => ({
          familiar: $familiar`Grey Goose`,
          modifier: `effective, 0.125 ${myPrimestat()} 400 max, ${myPrimestat()} experience, 5 ${myPrimestat()} experience percent, 10 familiar experience, ${noML()}`,
        }),
        prepare: () => {
          restoreHp(0.9 * myHp());
          if (itemAmount($item`eldritch essence`) > 0)
            putCloset(itemAmount($item`eldritch essence`), $item`eldritch essence`);
        },
        do: () => {
          visitUrl("place.php?whichplace=forestvillage&action=fv_scientist");
          runChoice(1);
        },
        combat: new CombatStrategy().macro(() =>
          Macro.externalIf(
            have($skill`Curse of Weaksauce`),
            Macro.trySkill($skill`Curse of Weaksauce`),
            Macro.tryItem($item`electronics kit`)
          )
            .externalIf(
              $familiar`Grey Goose`.experience >= 400,
              Macro.trySkill(
                myPrimestat() === $stat`Muscle`
                  ? $skill`Convert Matter to Protein`
                  : myPrimestat() === $stat`Mysticality`
                  ? $skill`Convert Matter to Energy`
                  : $skill`Convert Matter to Pomade`
              )
            )
            .tryItem($item`porquoise-handled sixgun`)
            .trySkill($skill`Sing Along`)
            .attack()
            .repeat()
        ),
        tracking: "Leveling",
      },
      {
        name: "God Lobster",
        ready: () =>
          myLevel() >= args.targetlevel - 1 &&
          !!$effects`HGH-charged, Different Way of Seeing Things, Thou Shant Not Sing`.find((ef) =>
            have(ef)
          ),
        completed: () => get("_godLobsterFights") >= 3,
        effects: $effects`Heart of White`,
        acquire: () => [
          ...(have($skill`Curse of Weaksauce`)
            ? []
            : [{ item: $item`electronics kit`, price: 500 }]),
          ...(have($familiar`God Lobster`)
            ? []
            : [{ item: $item`Dish of Clarified Butter`, price: get("valueOfAdventure") / 2 }]),
          ...(have($item`January's Garbage Tote`)
            ? [{ item: $item`makeshift garbage shirt` }]
            : []),
        ],
        outfit: () => ({
          ...(have($familiar`God Lobster`) ? { familiar: $familiar`God Lobster` } : {}),
          ...(have($item`makeshift garbage shirt`)
            ? { shirt: $item`makeshift garbage shirt` }
            : {}),
          modifier: `effective, 0.125 ${myPrimestat()}, ${myPrimestat()} experience, 5 ${myPrimestat()} experience percent, ${noML()}`,
        }),
        choices: {
          1310: 3,
        },
        prepare: (): void => {
          restoreHp(0.75 * myMaxhp());
          restoreMp(8);
        },
        do: () => {
          if (have($familiar`God Lobster`)) visitUrl("main.php?fightgodlobster=1");
          else use($item`Dish of Clarified Butter`);
          runCombat();
          visitUrl("choice.php");
          if (handlingChoice()) runChoice(-1);
        },
        post: () => {
          if (!get("_lastCombatWon"))
            throw new Error("Lost Combat - Check to see what went wrong.");
        },
        combat: new CombatStrategy().macro(() =>
          Macro.step("pickpocket")
            .externalIf(
              have($skill`Curse of Weaksauce`),
              Macro.trySkill($skill`Curse of Weaksauce`),
              Macro.tryItem($item`electronics kit`)
            )
            .tryItem($item`porquoise-handled sixgun`)
            .trySkill($skill`Sing Along`)
            .trySkill($skill`Feel Pride`)
            .attack()
            .repeat()
        ),
        limit: { tries: 3 },
        tracking: "Leveling",
      },
      {
        name: "NEP Free Fights",
        ready: () =>
          get("neverendingPartyAlways") &&
          !!$effects`HGH-charged, Different Way of Seeing Things, Thou Shant Not Sing`.find((ef) =>
            have(ef)
          ),
        completed: () =>
          get("_neverendingPartyFreeTurns") >= 10 ||
          (myClass() !== $class`Grey Goo` && myLevel() >= args.targetlevel),
        effects: $effects`Heart of White`,
        acquire: () => [
          ...(have($skill`Curse of Weaksauce`)
            ? []
            : [{ item: $item`electronics kit`, price: 500 }]),
          ...(have($item`January's Garbage Tote`)
            ? [{ item: $item`makeshift garbage shirt` }]
            : []),
        ],
        outfit: () => ({
          familiar: $familiar`Grey Goose`,
          ...(have($item`makeshift garbage shirt`)
            ? { shirt: $item`makeshift garbage shirt` }
            : {}),
          modifier: `effective, 0.125 ${myPrimestat()}, ${myPrimestat()} experience, 5 ${myPrimestat()} experience percent, 10 familiar experience, ${noML()}`,
        }),
        prepare: (): void => {
          restoreHp(0.75 * myMaxhp());
          restoreMp(8);
        },
        do: $location`The Neverending Party`,
        post: () => {
          if (!get("_lastCombatWon"))
            throw new Error("Lost Combat - Check to see what went wrong.");
        },
        choices: {
          1322: 2, //don't take NEP quest
          1324: 5, //fight a partier
        },
        combat: new CombatStrategy().macro(() =>
          Macro.step("pickpocket")
            .externalIf(
              have($skill`Curse of Weaksauce`),
              Macro.trySkill($skill`Curse of Weaksauce`),
              Macro.tryItem($item`electronics kit`)
            )
            .trySkill($skill`Bowl Sideways`)
            .externalIf(
              $familiar`Grey Goose`.experience >= 400,
              Macro.trySkill(
                myPrimestat() === $stat`Muscle`
                  ? $skill`Convert Matter to Protein`
                  : myPrimestat() === $stat`Mysticality`
                  ? $skill`Convert Matter to Energy`
                  : $skill`Convert Matter to Pomade`
              )
            )
            .tryItem(...$items`porquoise-handled sixgun, HOA citation pad`)
            .trySkill($skill`Sing Along`)
            .externalIf(myLevel() >= args.targetlevel - 2, Macro.trySkill($skill`Feel Pride`))
            .attack()
            .repeat()
        ),
        limit: { tries: 13 }, //+3 for unaccounted for wanderers, etc.
        tracking: "Leveling",
      },
      {
        name: "Gators",
        ready: () =>
          !!$effects`HGH-charged, Different Way of Seeing Things, Thou Shant Not Sing`.find((ef) =>
            have(ef)
          ),
        completed: () => false,
        effects: $effects`Heart of White, Expert Vacationer`,
        acquire: () => [
          ...(have($skill`Curse of Weaksauce`)
            ? []
            : [{ item: $item`electronics kit`, price: 500 }]),
          ...(have($item`January's Garbage Tote`)
            ? [{ item: $item`makeshift garbage shirt` }]
            : []),
        ],
        outfit: () => ({
          familiar: $familiar`Grey Goose`,
          ...(have($item`The Jokester's gun`) &&
          myBasestat($stat`Moxie`) >= 50 &&
          !get("_firedJokestersGun")
            ? { weapon: $item`The Jokester's gun` }
            : have($item`Lil' Doctor™ bag`) && get("_chestXRayUsed") < 3
            ? { equip: [$item`Lil' Doctor™ bag`] }
            : {}),
          ...(have($item`makeshift garbage shirt`)
            ? { shirt: $item`makeshift garbage shirt` }
            : {}),
          modifier: `effective, 0.125 ${myPrimestat()}, ${myPrimestat()} experience, 5 ${myPrimestat()} experience percent, 10 familiar experience, ${noML()}`,
        }),
        prepare: (): void => {
          restoreHp(0.75 * myMaxhp());
          restoreMp(8);
        },
        do: $location`Uncle Gator's Country Fun-Time Liquid Waste Sluice`,
        post: () => {
          if (!get("_lastCombatWon"))
            throw new Error("Lost Combat - Check to see what went wrong.");
        },
        combat: new CombatStrategy().macro(() =>
          Macro.step("pickpocket")
            .externalIf(
              have($skill`Curse of Weaksauce`),
              Macro.trySkill($skill`Curse of Weaksauce`),
              Macro.tryItem($item`electronics kit`)
            )
            .trySkill($skill`Bowl Sideways`)
            .externalIf(
              $familiar`Grey Goose`.experience >= 400,
              Macro.trySkill(
                myPrimestat() === $stat`Muscle`
                  ? $skill`Convert Matter to Protein`
                  : myPrimestat() === $stat`Mysticality`
                  ? $skill`Convert Matter to Energy`
                  : $skill`Convert Matter to Pomade`
              )
            )
            .tryItem($item`porquoise-handled sixgun`)
            .trySkill($skill`Sing Along`)
            .externalIf(myLevel() >= args.targetlevel - 2, Macro.trySkill($skill`Feel Pride`))
            .trySkill($skill`Fire the Jokester's Gun`)
            .trySkill($skill`Chest X-Ray`)
            .trySkill($skill`Gingerbread Mob Hit`)
            .trySkill($skill`Shattering Punch`)
            .attack()
            .repeat()
        ),
        limit: { tries: levelingTurns + 3 }, //+3 for unaccounted for wanderers, etc.
        tracking: "Leveling",
      },
      {
        name: "Alert-Leveling Failed",
        completed: () => myLevel() >= args.targetlevel,
        do: (): void => {
          throw new Error(
            `Finished Leveling Tasks, but only reached level ${myLevel()}/${args.targetlevel}`
          );
        },
      },
    ],
  };
}
