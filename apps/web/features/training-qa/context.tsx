'use client';
import { createContext, useContext } from 'react';
import type { Traveler } from '../journey/domain/traveler';
export const TrainingTravelerContext = createContext<Traveler | null>(null);
export const useTrainingTraveler = () => useContext(TrainingTravelerContext);
