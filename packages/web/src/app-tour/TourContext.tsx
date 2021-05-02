import React, { createContext } from 'react';
import { FirstTimeExperience } from '../firstTimeExperience/constants';

type Measures = { x: number, y: number, width: number, height: number, pageX: number, pageY: number }

export type TourKey = typeof FirstTimeExperience[number]['id']

export type ContentCallback = ((args: { onClose: () => void, spotlightMeasures: Measures | undefined, spotlightSize: undefined | number }) => React.ReactNode)

export type Step = {
  measures: undefined | Measures;
  spotlightSize: undefined | number;
  spotlightMargin: undefined | number;
  content: React.ReactNode | ContentCallback
  withButtons: boolean
};

type TourContextType = {
  tours: {
    [K in TourKey]?: {
      steps: { [key: string]: Step };
    }
  },
  registerOrUpdateStep: (key: TourKey, stepNumber: number, step: Step) => void;
};

export const TourContext = createContext<TourContextType | undefined>(undefined);
