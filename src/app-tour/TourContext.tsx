import { createContext } from 'react';

export type TourKey =
  | 'ExistingUserFirstTimeLibrary'
  | 'FirstTimeCoverLongPress'
  | 'EistingUserFirstTimeLibrarySearch'
  | 'NewUserFirstTimeFilterLibrary'
  | 'FirstTimeDownload';

type Step = {
  measures: undefined | { x: number, y: number, width: number, height: number, pageX: number, pageY: number };
  spotlightSize: undefined | number;
  spotlightMargin: undefined | number;
  content: React.ReactNode;
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
