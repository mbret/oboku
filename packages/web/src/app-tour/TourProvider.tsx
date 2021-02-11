import React, { useMemo, useCallback, ComponentProps, useState, memo } from 'react';
import { TourContext, TourKey } from './TourContext';

type Context = NonNullable<ComponentProps<typeof TourContext['Provider']>['value']>;

export const TourProvider: React.FC = memo(({ children }) => {
  const [tours, setTours] = useState<Context['tours']>({});

  const registerOrUpdateStep = useCallback((tour: TourKey, number: number, step: any) => {
    setTours(prevState => ({
      ...prevState,
      [tour]: {
        show: prevState[tour]?.show || false,
        steps: {
          ...prevState[tour]?.steps,
          [number]: step,
        },
      },
    }));
  }, []);

  const toggleTour = useCallback((tour: TourKey, show: boolean) => {
    setTours(prevState => ({
      ...prevState,
      [tour]: {
        show,
        steps: prevState[tour]?.steps || {},
      },
    }));
  }, []);

  const tourContext = useMemo(() => ({
    tours,
    registerOrUpdateStep,
    toggleTour,
  }), [tours, registerOrUpdateStep, toggleTour]);

  return (
    <TourContext.Provider value={tourContext}>
      {children}
    </TourContext.Provider>
  );
});