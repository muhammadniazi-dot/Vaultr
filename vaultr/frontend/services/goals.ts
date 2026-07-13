import api from './api';
import type { CreateGoalPayload, Goal } from '../types';

export async function createGoal(payload: CreateGoalPayload): Promise<Goal> {
  const { data } = await api.post<Goal>('/goals', payload);
  return data;
}
