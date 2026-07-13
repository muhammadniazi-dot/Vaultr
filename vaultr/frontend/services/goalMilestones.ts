import * as Haptics from 'expo-haptics';
import * as secureStorage from './secureStorage';

/** Milestones checked in ascending order — a goal can jump straight past one
 * if e.g. a single large deposit takes it from 10% to 80%; in that case only
 * the highest newly-crossed milestone is reported (no need to "replay" 25/50). */
const MILESTONES = [25, 50, 75, 100] as const;

function storageKey(goalId: string): string {
  return `vaultr_goal_milestone_${goalId}`;
}

async function getReachedMilestone(goalId: string): Promise<number> {
  const raw = await secureStorage.getItemAsync(storageKey(goalId));
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

async function setReachedMilestone(goalId: string, milestone: number): Promise<void> {
  await secureStorage.setItemAsync(storageKey(goalId), String(milestone));
}

function triggerHaptic(milestone: number): void {
  try {
    if (milestone >= 100) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch {
    // Haptics aren't available on every platform (e.g. web) — never let that
    // block anything else in the caller.
  }
}

/**
 * Checks a goal's current progress against milestones already recorded for it
 * (persisted in Secure Store so re-opening the app doesn't re-fire haptics for
 * ground already covered), fires haptic feedback for any newly-crossed
 * milestone, and persists the new high-water mark.
 *
 * Returns the highest newly-crossed milestone (e.g. 100), or null if no new
 * milestone was crossed.
 */
export async function checkGoalMilestone(goalId: string, progressPercent: number): Promise<number | null> {
  const alreadyReached = await getReachedMilestone(goalId);
  const crossed = MILESTONES.filter((m) => progressPercent >= m && m > alreadyReached);
  if (crossed.length === 0) return null;

  const newMilestone = crossed[crossed.length - 1];
  await setReachedMilestone(goalId, newMilestone);
  triggerHaptic(newMilestone);
  return newMilestone;
}
