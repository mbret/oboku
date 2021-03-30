import React, { useMemo, useCallback, ComponentProps, useState, memo } from 'react';
import { TourContext, TourKey } from './TourContext';

type Context = NonNullable<ComponentProps<typeof TourContext['Provider']>['value']>;

export const TourProvider: React.FC = memo(({ children }) => {
  const [tours, setTours] = useState<Context['tours']>({});

  const registerOrUpdateStep = useCallback((tour: TourKey, number: number, step: any) => {
    setTours(prevState => ({
      ...prevState,
      [tour]: {
        steps: {
          ...prevState[tour]?.steps,
          [number]: step,
        },
      },
    }));
  }, []);

  const tourContext = useMemo(() => ({
    tours,
    registerOrUpdateStep,
  }), [tours, registerOrUpdateStep]);

  return (
    <TourContext.Provider value={tourContext}>
      {children}
    </TourContext.Provider>
  );
});