import React, { useContext, useEffect, memo } from 'react';
import { TourContent } from './TourContent';
import { TourContext, TourKey } from './TourContext';

type Props = {
  id: TourKey;
  show?: boolean;
  unskippable?: boolean;
  onClose: () => void;
};

export const Tour: React.FC<Props> = memo(({ children, id, show = false, unskippable, onClose }) => {
  const { toggleTour } = useContext(TourContext) || {};

  useEffect(() => {
    toggleTour && toggleTour(id, show);
  }, [show, id, toggleTour]);

  return (
    <>
      {show && (
        <TourContent
          id={id}
          unskippable={unskippable}
          onClose={onClose}
        />
      )}
      {children}
    </>
  );
});