import Dexie, { type Table } from "dexie";

export type Split = "Empuje" | "Tracción" | "Pierna" | "Custom";

export interface Routine {
  id?: number;
  name: string;
  split: Split;
  createdAt: number;
}

export interface Exercise {
  id?: number;
  routineId: number;
  name: string;
  order: number;
  targetSets: number;
  targetReps: number;
  defaultRestSec: number;
}

export interface Session {
  id?: number;
  routineId: number;
  startedAt: number;
  endedAt?: number;
}

export interface SetLog {
  id?: number;
  sessionId: number;
  exerciseId: number;
  setNumber: number;
  reps: number;
  rpe: number;
  restSec: number;
  completedAt: number;
}

export interface Setting {
  key: string;
  value: string | number | boolean;
}

export class CalistenIADB extends Dexie {
  routines!: Table<Routine, number>;
  exercises!: Table<Exercise, number>;
  sessions!: Table<Session, number>;
  setLogs!: Table<SetLog, number>;
  settings!: Table<Setting, string>;

  constructor() {
    super("calistenia");
    this.version(1).stores({
      routines: "++id, name, split, createdAt",
      exercises: "++id, routineId, order",
      sessions: "++id, routineId, startedAt, endedAt",
      setLogs: "++id, sessionId, exerciseId, completedAt",
      settings: "&key",
    });
  }
}

export const db = new CalistenIADB();

export async function ensureSeed() {
  const count = await db.routines.count();
  if (count > 0) return;

  await db.transaction("rw", db.routines, db.exercises, db.settings, async () => {
    const now = Date.now();

    const pushId = await db.routines.add({ name: "Empuje", split: "Empuje", createdAt: now });
    const pullId = await db.routines.add({ name: "Tracción", split: "Tracción", createdAt: now + 1 });
    const legsId = await db.routines.add({ name: "Pierna", split: "Pierna", createdAt: now + 2 });

    const push: Omit<Exercise, "id">[] = [
      { routineId: pushId, name: "Flexiones diamante", order: 0, targetSets: 4, targetReps: 12, defaultRestSec: 90 },
      { routineId: pushId, name: "Fondos en paralelas", order: 1, targetSets: 4, targetReps: 8, defaultRestSec: 120 },
      { routineId: pushId, name: "Pike push-ups", order: 2, targetSets: 3, targetReps: 10, defaultRestSec: 90 },
    ];
    const pull: Omit<Exercise, "id">[] = [
      { routineId: pullId, name: "Dominadas", order: 0, targetSets: 4, targetReps: 8, defaultRestSec: 120 },
      { routineId: pullId, name: "Remo australiano", order: 1, targetSets: 4, targetReps: 12, defaultRestSec: 90 },
      { routineId: pullId, name: "Curl en barra baja", order: 2, targetSets: 3, targetReps: 10, defaultRestSec: 75 },
    ];
    const legs: Omit<Exercise, "id">[] = [
      { routineId: legsId, name: "Sentadillas búlgaras", order: 0, targetSets: 4, targetReps: 10, defaultRestSec: 120 },
      { routineId: legsId, name: "Pistol squat asistido", order: 1, targetSets: 3, targetReps: 6, defaultRestSec: 120 },
      { routineId: legsId, name: "Puente glúteo a una pierna", order: 2, targetSets: 3, targetReps: 12, defaultRestSec: 75 },
    ];

    await db.exercises.bulkAdd([...push, ...pull, ...legs]);

    await db.settings.bulkPut([
      { key: "restDefault", value: 90 },
      { key: "soundOn", value: true },
      { key: "vibrateOn", value: true },
    ]);
  });
}

export async function getSetting<T = string | number | boolean>(
  key: string,
  fallback: T,
): Promise<T> {
  const row = await db.settings.get(key);
  return (row?.value as T) ?? fallback;
}

export async function setSetting(key: string, value: string | number | boolean) {
  await db.settings.put({ key, value });
}

export async function deleteAllHistory() {
  await db.transaction("rw", db.sessions, db.setLogs, async () => {
    await db.setLogs.clear();
    await db.sessions.clear();
  });
}