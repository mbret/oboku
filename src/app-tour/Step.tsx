import React, { useContext, useEffect, useState, useRef, useCallback, memo } from 'react';
import { useMeasure } from 'react-use';
// import { View, LayoutRectangle, findNodeHandle, UIManager, ViewStyle } from 'react-native';
import { Step as StepType, TourContext, TourKey } from './TourContext';

type Props = {
  number: number;
  content?: StepType['content'];
  style?: React.CSSProperties;
  id: TourKey;
  spotlightSize?: number;
  spotlightMargin?: number;
  testID?: string;
  withButtons?: boolean
};

export const Step: React.FC<Props> = memo(({ withButtons = true, children, id, number, content, style, spotlightSize, spotlightMargin }) => {
  const { tours = {}, registerOrUpdateStep } = useContext(TourContext) || {};
  const [ref, layout] = useMeasure();
  const tour = tours[id];
  // const [layout, setLayout] = useState<LayoutRectangle | undefined>(undefined);
  // const containerRef = useRef<any>();

  useEffect(() => {
    console.log('on layout', layout)
    if (!layout.width) return;

    if (!children) {
      registerOrUpdateStep && registerOrUpdateStep(id, number, {
        measures: undefined,
        spotlightSize,
        spotlightMargin,
        content,
        withButtons,
      });
    } else {
      // const node = findNodeHandle(containerRef.current);
      // node && UIManager.measureInWindow(node, (pageX, pageY, width, height) => {
        registerOrUpdateStep && registerOrUpdateStep(id, number, {
          measures: { x: 0, y: 0, width: layout.width, height: layout.height, pageX: layout.x, pageY: layout.y },
          spotlightSize,
          spotlightMargin,
          content,
          withButtons,
        });
      // });
    }
  }, [registerOrUpdateStep, id, number, layout, withButtons, content, tour?.show, children, spotlightSize, spotlightMargin]);

  // const onLayout = useCallback(event => {
  //   setLayout(event.nativeEvent.layout);
  // }, []);

  return (
    <div
      ref={ref as any}
      style={style}
      // onLayout={onLayout}
    >
      {children}
    </div>
  );
});