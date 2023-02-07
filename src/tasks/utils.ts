import {
  chew,
  cliExecute,
  Effect,
  Familiar,
  fullnessLimit,
  getCampground,
  getWorkshed,
  inebrietyLimit,
  Item,
  itemAmount,
  mallPrice,
  Monster,
  myAdventures,
  myFamiliar,
  myFullness,
  myInebriety,
  myLevel,
  mySpleenUse,
  retrieveItem,
  spleenLimit,
  use,
} from "kolmafia";
import {
  $familiar,
  $familiars,
  $item,
  $items,
  $phylum,
  get,
  getBanishedMonsters,
  have,
  Snapper,
} from "libram";
import { garboAverageValue, garboValue } from "../engine/profits";
import { args } from "../args";

export function haveAll(its: Item[]): boolean {
  return its.reduce((a, it) => a && have(it), true);
}
export function haveAny(its: Item[]): boolean {
  return its.reduce((a, it) => a || have(it), false);
}

type MoonSign =
  | number
  | "mongoose"
  | "wallaby"
  | "vole"
  | "platypus"
  | "opossum"
  | "marmot"
  | "wombat"
  | "blender"
  | "packrat"
  | "gnomads"
  | "knoll"
  | "canadia";
export function toMoonSign(str: string | MoonSign): MoonSign {
  if (
    typeof str === "string" &&
    [
      "mongoose",
      "wallaby",
      "vole",
      "platypus",
      "opossum",
      "marmot",
      "wombat",
      "blender",
      "packrat",
      "gnomads",
      "knoll",
      "canadia",
    ].includes(str)
  )
    return str as MoonSign;
  throw new Error(`${str} is not a valid MoonSign`);
}

const minusMLItems = $items`nasty rat mask, Drowsy Sword, HOA regulation book, pocketwatch on a chain, security flashlight, Space Trip safety headphones, pine cone necklace, red badge, mushroom badge, water wings for babies, white earbuds, discarded bowtie`;
export function noML(): string {
  return `-ml, ${minusMLItems
    .filter((it) => have(it))
    .map((it) => `-equip ${it.name}`)
    .join(", ")}`;
}

export function maxBase(): string {
  return `175 bonus June Cleaver, ${
    garboValue($item`FunFunds™`) / 20 + 5
  } bonus lucky gold ring, 250 bonus Mr. Cheeng's spectacles, ${
    0.4 * get("valueOfAdventure")
  } bonus mafia thumb ring, 10 bonus tiny stillsuit`;
}

function famValue(fam: Familiar, mob?: Monster) {
  switch (fam) {
    case $familiar`Grey Goose`:
      return myLevel() < args.targetlevel && $familiar`Grey Goose`.experience < 400 ? 6000 : 0;
    case $familiar`Red-Nosed Snapper`:
      if (mob && Snapper.getTrackedPhylum() && mob.phylum === Snapper.getTrackedPhylum())
        return (
          garboValue(
            Snapper.phylumItem.get(Snapper.getTrackedPhylum() || $phylum`none`) || $item`none`
          ) / 11
        );
      return 0;
    case $familiar`Cookbookbat`:
      return $items``.find((it) => it.name.indexOf("Recipe of Before Yore") >= 0 && have(it))
        ? garboAverageValue(
            ...$items`Yeast of Boris, Vegetable of Jarlsberg, St. Sneaky Pete's Whey`
          ) *
            (3.0 / 11)
        : 5000;
    case $familiar`Shorter-Order Cook`:
      return (
        garboAverageValue(
          ...$items`short white, short beer, short glass of water, short stack of pancakes, short stick of butter`
        ) / 11
      );
  }
  return 0;
}

export function meatFam() {
  return (
    $familiars`Space Jellyfish, Robortender, Hobo Monkey, Cat Burglar`.find((fam) => have(fam)) ||
    $familiar`Leprechaun`
  );
}

export function bestFam(mob?: Monster) {
  const fams = $familiars`Grey Goose, Red-Nosed Snapper, Cookbookbat, Shorter-Order Cook`
    .filter((fam) => have(fam))
    .sort((a, b) => famValue(b, mob) - famValue(a, mob));
  return fams.find((fam) => have(fam));
}

export function canDiet(): boolean {
  return (
    myFullness() < fullnessLimit() ||
    mySpleenUse() < spleenLimit() ||
    myInebriety() < inebrietyLimit() ||
    (have($item`distention pill`) && !get("_distentionPillUsed")) ||
    (have($item`synthetic dog hair pill`) && !get("_syntheticDogHairPillUsed")) ||
    (have($item`designer sweatpants`) && get("_sweatOutSomeBoozeUsed") < 3 && get("sweat") >= 25) ||
    (have($item`mime army shotglass`) && !get("_mimeArmyShotglassUsed")) ||
    (get("currentMojoFilters") < 3 &&
      mallPrice($item`mojo filter`) + mallPrice($item`transdermal smoke patch`) <
        2.5 * get("valueOfAdventure"))
  );
}

export function stooperDrunk(): boolean {
  return (
    myInebriety() > inebrietyLimit() ||
    (myInebriety() === inebrietyLimit() && myFamiliar() === $familiar`Stooper`)
  );
}

export function totallyDrunk(): boolean {
  return have($familiar`Stooper`) && myFamiliar() !== $familiar`Stooper`
    ? myInebriety() > inebrietyLimit() + 1
    : myInebriety() > inebrietyLimit();
}

export function doneAdventuring(): boolean {
  return (!canDiet() && myAdventures() === 0) || stooperDrunk();
}

export function backstageItemsDone(): boolean {
  return (
    (have($item`giant marshmallow`) ? 1 : 0) +
      (have($item`beer-scented teddy bear`) ? 1 : 0) +
      itemAmount($item`gin-soaked blotter paper`) >=
      2 &&
    (have($item`booze-soaked cherry`) ? 1 : 0) +
      (have($item`comfy pillow`) ? 1 : 0) +
      itemAmount($item`sponge cake`) >=
      2
  );
}

const gardens = $items`packet of pumpkin seeds, Peppermint Pip Packet, packet of dragon's teeth, packet of beer seeds, packet of winter seeds, packet of thanksgarden seeds, packet of tall grass seeds, packet of mushroom spores`;
export function getGarden(): Item {
  return gardens.find((it) => it.name in getCampground()) || $item`none`;
}

let banishes: Item[];
export function nextUnusedBanishItem(): Item {
  if (!banishes)
    banishes = $items`human musk, tennis ball, Louder Than Bomb, divine champagne popper`.sort(
      (a, b) => mallPrice(a) - mallPrice(b)
    ); //sorted from cheapest to most expensive
  return banishes.find((it) => !getBanishedMonsters().get(it)) || $item`none`; //return the cheapest free banish not currently in use
}

export function chewOrWish(it: Item, ef: Effect): void {
  if (mallPrice(it) + mallPrice($item`mojo filter`) < mallPrice($item`pocket wish`)) {
    if (mySpleenUse() === spleenLimit()) use(1, $item`mojo filter`);
    chew(it);
  } else {
    retrieveItem($item`pocket wish`);
    cliExecute(`genie effect ${ef.name}`);
  }
}

export function expectCMC() {
  return (
    getWorkshed() !== $item`cold medicine cabinet` &&
    have($item`cold medicine cabinet`) &&
    !get("_workshedItemUsed")
  );
}

export function isGoodGarboScript(scr: string): boolean {
  // Returns true if scr includes "garbo", and doesn't include a semicolon
  return scr.includes("garbo") && !scr.includes(";");
}
