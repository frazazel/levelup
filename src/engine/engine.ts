import { CombatResources, CombatStrategy, Engine } from "grimoire-kolmafia";
import { cliExecute, Location, logprint, setAutoAttack, writeCcs } from "kolmafia";
import { clearMaximizerCache } from "libram";
import { Task } from "../tasks/structure";
import { printProfits, ProfitTracker } from "./profits";

const grimoireCCS = "grimoire_macro";
const ccsAbortString = "if pastround 2;abort Failed to finish combat in autoattack;endif;";

export class ProfitTrackingEngine extends Engine<never, Task> {
  profits: ProfitTracker;
  constructor(tasks: Task[], key: string) {
    super(tasks);
    this.profits = new ProfitTracker(key);
  }

  setCombat(
    task: Task,
    task_combat: CombatStrategy<never>,
    task_resources: CombatResources<never>
  ): void {
    // Save regular combat macro
    const macro = task_combat.compile(
      task_resources,
      this.options?.combat_defaults,
      task.do instanceof Location ? task.do : undefined
    );
    if (macro.toString().length > 1) {
      macro.save();
      if (!this.options.ccs) {
        // Use the macro through a CCS file
        const otherCCSEntries = task_combat.compileCcs();
        const ccsContents = [
          "[default]",
          `"${ccsAbortString}${macro.toString()}"`,
          ...otherCCSEntries,
        ].join("\n");

        // Log Macro + other CCS
        logprint(`CCS: ${ccsContents.replace("\n", "\\n ")}`);

        if (ccsContents !== this.cachedCcsContents) {
          writeCcs(ccsContents, grimoireCCS);
          cliExecute(`ccs ${grimoireCCS}`); // force Mafia to reparse the ccs
          const autoattack = task_combat.compileAutoattack().step(macro);
          if (autoattack.toString().length > 1) {
            autoattack.save();
            autoattack.setAutoAttack();
          } else {
            setAutoAttack(0);
          }
          this.cachedCcsContents = ccsContents;
        }
      }
    }
  }

  public checkLimits(task: Task, postcondition: (() => boolean) | undefined): void {
    if (task.clear && !(task.clear instanceof Array))
      task.clear = task.clear === "all" ? ["outfit", "macro"] : [task.clear]; //convert to an array of appropriate strings
    if (task.clear && task.clear.includes("macro")) this.cachedCcsContents = "";
    if (task.clear && task.clear.includes("outfit")) {
      clearMaximizerCache();
    }

    super.checkLimits({ limit: { tries: 1 }, ...task }, postcondition); //sets the default value of limit
  }

  execute(task: Task): void {
    try {
      super.execute(task);
    } finally {
      this.profits.record(`${task.tracking ?? "Other"}`, task.name);
    }
  }

  destruct(): void {
    super.destruct();
    this.profits.save();
    printProfits(this.profits.all());
  }
}
