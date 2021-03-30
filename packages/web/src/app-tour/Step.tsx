import React, { useContext, useEffect, memo, useRef, useCallback } from 'react';
import { useMeasure } from 'react-use';
import { Step as StepType, TourContext, TourKey } from './TourContext';

export const Step: React.FC<{
  number: number;
  content?: StepType['content'];
  style?: React.CSSProperties;
  id: TourKey;
  spotlightSize?: number;
  spotlightMargin?: number;
  testID?: string;
  withButtons?: boolean
}> = memo(({ withButtons = true, children, id, number, content, style, spotlightSize, spotlightMargin }) => {
  const { registerOrUpdateStep } = useContext(TourContext) || {};
  const [measureRef, layout] = useMeasure();
  const ref = useRef<HTMLElement>();
  const registerRef = useCallback((_ref) => {
    if (_ref) {
      measureRef(_ref)
      ref.current = _ref
    }
  }, [measureRef])
  const hasChildren = !!children

  useEffect(() => {
    if ("width" in layout && !layout.width) return;

    if (!hasChildren) {
      registerOrUpdateStep && registerOrUpdateStep(id, number, {
        measures: undefined,
        spotlightSize,
        spotlightMargin,
        content,
        withButtons,
      });
    } else {
      const boundingRect = ref.current?.getBoundingClientRect()
      registerOrUpdateStep && registerOrUpdateStep(id, number, {
        measures: { x: 0, y: 0, width: layout.width, height: layout.height, pageX: boundingRect?.x || 0, pageY: boundingRect?.y || 0 },
        spotlightSize,
        spotlightMargin,
        content,
        withButtons,
      });
    }
  }, [registerOrUpdateStep, id, number, layout, withButtons, content, hasChildren, spotlightSize, spotlightMargin]);

  return (
    <div
      ref={registerRef}
      style={style}
    >
      {children}
    </div>
  );
});