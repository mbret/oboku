import React, { createContext } from 'react';

export type TourKey =
  | 'AppTourReader'
  | 'AppTourWelcome'

export type Step = {
  measures: undefined | { x: number, y: number, width: number, height: number, pageX: number, pageY: number };
  spotlightSize: undefined | number;
  spotlightMargin: undefined | number;
  content: React.ReactNode | ((args: { onClose: () => void }) => React.ReactNode)
  withButtons: boolean
};

type TourContext = {
  tours: {
    [K in TourKey]?: {
      steps: { [key: string]: Step };
      show: boolean;
    }
  },
  registerOrUpdateStep: (key: TourKey, stepNumber: number, step: Step) => void;
  toggleTour: (key: TourKey, show: boolean) => void;
};

export const TourContext = createContext<TourContext | undefined>(undefined);
