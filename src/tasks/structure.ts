import { Quest as BaseQuest, Task as BaseTask, Limit } from "grimoire-kolmafia";

export type Task = BaseTask & {
  tracking?: string;
  limit?: Limit;
  clear?: "all" | "outfit" | "macro" | ("outfit" | "macro")[];
};

export type Quest = BaseQuest<Task>;
