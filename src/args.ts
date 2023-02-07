import { Args } from "grimoire-kolmafia";

export const args = Args.create(
  "levelup",
  `Written by frazazel (ign: SketchySolid #422389). This is a script that levels you up using inexpensive resources.`,
  {
    version: Args.flag({
      help: "Output script version number and exit.",
      default: false,
      setting: "",
    }),
    actions: Args.number({
      help: "Maximum number of actions to perform, if given. Can be used to execute just a few steps at a time.",
    }),
    abort: Args.string({
      help: "If given, abort during the prepare() step for the task with matching name.",
    }),
    sim: Args.flag({
      help: "If set, see the recommended items and skills, then return without taking any actions.",
      default: false,
      setting: "",
    }),
    list: Args.flag({
      help: "Show the status of all tasks and exit.",
      setting: "",
    }),

    clan: Args.string({
      help: `Your VIP Clan. Levelup will whitelist into it at the beginning of your day. Requires clan whitelist.`,
    }),
    targetlevel: Args.number({
      help: `What level to target via adventuring in Uncle Gator's after breaking the prism`,
      default: 13,
    }),

    buffy: Args.boolean({
      help: "Set this to false to stop asking Buffy for buffs.",
      default: true,
    }),

    tip: Args.flag({
      help: "Send all your soap knives to the author. Thanks!",
      default: false,
    }),
  }
);
