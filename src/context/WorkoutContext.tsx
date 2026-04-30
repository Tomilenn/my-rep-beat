import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { db, ensureSeed, getSetting } from "@/lib/db";
import { unlockAudio, beep as playBeep } from "@/lib/audio";
import { vibrate } from "@/lib/haptics";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";

interface RestState {
  exerciseId: number;
  endAt: number;
  durationSec: number;
}

interface WorkoutCtx {
  sessionId: number | null;
  routineId: number | null;
  setLogsCount: number;
  rest: RestState | null;
  soundOn: boolean;
  vibrateOn: boolean;
  setSoundOn: (v: boolean) => void;
  setVibrateOn: (v: boolean) => void;
  startSession: (routineId: number) => Promise<void>;
  endSession: () => Promise<void>;
  completeSet: (args: {
    exerciseId: number;
    setNumber: number;
    reps: number;
    rpe: number;
    restSec: number;
  }) => Promise<void>;
  adjustRest: (deltaSec: number) => void;
  skipRest: () => void;
}

const Ctx = createContext<WorkoutCtx | null>(null);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [routineId, setRoutineId] = useState<number | null>(null);
  const [setLogsCount, setSetLogsCount] = useState(0);
  const [rest, setRest] = useState<RestState | null>(null);
  const [soundOn, setSoundOnState] = useState(true);
  const [vibrateOn, setVibrateOnState] = useState(true);
  const beepFiredRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureSeed();
      const s = await getSetting<boolean>("soundOn", true);
      const v = await getSetting<boolean>("vibrateOn", true);
      if (!cancelled) {
        setSoundOnState(s);
        setVibrateOnState(v);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useBeforeUnload(sessionId !== null);

  useEffect(() => {
    if (!rest) {
      beepFiredRef.current = false;
      return;
    }
    beepFiredRef.current = false;
    let raf = 0;
    const tick = () => {
      const r = rest.endAt - performance.now();
      if (r <= 0 && !beepFiredRef.current) {
        beepFiredRef.current = true;
        if (soundOn) playBeep();
        if (vibrateOn) vibrate([200, 100, 200]);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rest, soundOn, vibrateOn]);

  const setSoundOn = useCallback((v: boolean) => {
    setSoundOnState(v);
    db.settings.put({ key: "soundOn", value: v });
  }, []);

  const setVibrateOn = useCallback((v: boolean) => {
    setVibrateOnState(v);
    db.settings.put({ key: "vibrateOn", value: v });
  }, []);

  const startSession = useCallback(async (rId: number) => {
    await unlockAudio();
    const id = await db.sessions.add({ routineId: rId, startedAt: Date.now() });
    setRoutineId(rId);
    setSessionId(id);
    setSetLogsCount(0);
    setRest(null);
  }, []);

  const endSession = useCallback(async () => {
    if (sessionId == null) return;
    await db.sessions.update(sessionId, { endedAt: Date.now() });
    const count = await db.setLogs.where("sessionId").equals(sessionId).count();
    if (count === 0) {
      await db.sessions.delete(sessionId);
    }
    setSessionId(null);
    setRoutineId(null);
    setSetLogsCount(0);
    setRest(null);
  }, [sessionId]);

  const completeSet = useCallback<WorkoutCtx["completeSet"]>(
    async ({ exerciseId, setNumber, reps, rpe, restSec }) => {
      if (sessionId == null) return;
      await db.setLogs.add({
        sessionId,
        exerciseId,
        setNumber,
        reps,
        rpe,
        restSec,
        completedAt: Date.now(),
      });
      setSetLogsCount((c) => c + 1);
      setRest({
        exerciseId,
        durationSec: restSec,
        endAt: performance.now() + restSec * 1000,
      });
    },
    [sessionId],
  );

  const adjustRest = useCallback((deltaSec: number) => {
    setRest((r) => (r ? { ...r, endAt: r.endAt + deltaSec * 1000 } : r));
  }, []);

  const skipRest = useCallback(() => setRest(null), []);

  const value = useMemo<WorkoutCtx>(
    () => ({
      sessionId,
      routineId,
      setLogsCount,
      rest,
      soundOn,
      vibrateOn,
      setSoundOn,
      setVibrateOn,
      startSession,
      endSession,
      completeSet,
      adjustRest,
      skipRest,
    }),
    [
      sessionId,
      routineId,
      setLogsCount,
      rest,
      soundOn,
      vibrateOn,
      setSoundOn,
      setVibrateOn,
      startSession,
      endSession,
      completeSet,
      adjustRest,
      skipRest,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkout() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWorkout must be used within WorkoutProvider");
  return v;
}