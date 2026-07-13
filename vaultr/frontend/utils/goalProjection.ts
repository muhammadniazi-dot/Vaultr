import type { Goal } from '../types';

export type ProjectionStatus = 'completed' | 'projected' | 'unknown';

export interface GoalProjection {
  status: ProjectionStatus;
  /** Human-readable line shown under the goal's amounts, e.g. "Projected: Mar 2027". */
  label: string;
  /** Only set when status === 'projected'. */
  date?: Date;
}

/**
 * Projects when a goal will be completed from its current progress and
 * monthly contribution:
 *   remaining = targetAmount - currentAmount
 *   monthsRemaining = remaining / monthlyContribution
 *   projectedDate = today + monthsRemaining months
 *
 * Falls back to a friendly placeholder when there's no contribution to
 * project from, and reports "Completed" once the target is reached.
 */
export function projectGoalCompletion(goal: Pick<Goal, 'targetAmount' | 'currentAmount' | 'monthlyContribution'>): GoalProjection {
  if (goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount) {
    return { status: 'completed', label: 'Completed' };
  }

  const contribution = goal.monthlyContribution ?? 0;
  if (!contribution || contribution <= 0) {
    return { status: 'unknown', label: 'Add a monthly contribution to see projection' };
  }

  const remaining = goal.targetAmount - goal.currentAmount;
  const monthsRemaining = Math.ceil(remaining / contribution);
  const date = new Date();
  date.setMonth(date.getMonth() + monthsRemaining);

  const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return { status: 'projected', label: `Projected: ${label}`, date };
}
