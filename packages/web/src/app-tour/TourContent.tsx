import { Backdrop, Box, Button, Modal, useTheme } from '@material-ui/core';
import React, { useContext, useState } from 'react';
// import { useWindowSize } from 'react-use';
// import { Modal, View, StyleSheet, useWindowDimensions } from 'react-native';
// import { useTranslation } from 'react-i18next';
// import Svg, { Path } from 'react-native-svg';
// import DeviceInfo from 'react-native-device-info';
// import { useMediaHelpers } from '@phoenix/ui-tools';
// import Swiper from 'react-native-swiper';
// import { Button } from '@src/commonComponents/Button';
// import Carousel from './Carousel';
import { TourContext, TourKey } from './TourContext';
// import { sizing } from '@material-ui/system'
import { useCSS } from '../common/utils';

type Props = {
  id: TourKey;
  unskippable?: boolean;
  onClose: () => void;
};

export const TourContent: React.FC<Props> = ({ id, unskippable, onClose }) => {
  // const { height: windowHeight, width: windowWidth } = useWindowSize();
  // const theme = useTheme()
  // const { t } = useTranslation();
  const { tours = {} } = useContext(TourContext) || {};
  const steps = tours[id]?.steps || {};
  // const swiperRef = useRef<Swiper>();
  const [step, setStep] = useState(0);
  // const [isCarouselMoving, setIsCarouselMoving] = useState(false);
  // const isTablet = false
  const numberOfSteps = Object.keys(steps).length;
  const currentStep = steps[step + 1];
  // const containerMeasure = currentStep?.measures || { pageX: 0, pageY: 0, width: 0, height: 0 };
  // const displaySpotlight = !isCarouselMoving && !!currentStep?.measures;
  const styles = useStyles();
  const isFinalStep = step === numberOfSteps - 1;
  const stepsAsArray = Object.values(steps);
  const stepContents = stepsAsArray.map(s => s.content);
  // const tabletBackdropSize = windowHeight > windowWidth ? windowHeight * 0.6 : windowWidth * 0.6;

  /**
   * So theses are the svg path used to draw everything you see on the spotlight.
   * I took inspiration from https://github.com/xcarpentier/rn-tourguide for the
   * spotlight small circle (mobileSvgSpotlightPath). If you want to change the shapes
   * or just play with it I suggest to use some tools (ex. https://jxnblk.github.io/).
   * Careful when you do any change, this part is quite annoying to get right.
   * Here are some extra documentation about the tablet background circle
   * @see https://stackoverflow.com/questions/5737975/circle-drawing-with-svgs-arc-path
   */
  // const margin = currentStep?.spotlightMargin || 30;
  // const spotlightSize = (currentStep?.spotlightSize || ((containerMeasure?.width || 0) + margin));
  // const spotlightSvgX = (containerMeasure?.pageX + (containerMeasure?.width / 2) - (spotlightSize / 2));
  // const spotlightSvgY = (containerMeasure?.pageY + (containerMeasure?.height / 2));
  // const svgSpotlightPath = `
  //   M${spotlightSvgX},${spotlightSvgY}Za1 1 0 1 0 ${spotlightSize} 0 1 1 0 1 0-${spotlightSize} 0
  // `;
  // const mobileSvgBackgroundFillerPath = `M0,0H${windowWidth}V${windowHeight}H0V0Z`;
  // const tabletSvgBackgroundCircleFillerPath = `
  //   M ${windowWidth / 2}, 0
  //   m -${tabletBackdropSize}, 0
  //   a ${tabletBackdropSize},${tabletBackdropSize} 0 1,0 ${tabletBackdropSize * 2},0
  //   a ${tabletBackdropSize},${tabletBackdropSize} 0 1,0 -${tabletBackdropSize * 2},0
  // `;

  console.log('Tour Context', stepContents)
  return (
    <Modal open={true}
      style={styles.modal}
      disableAutoFocus
      disableEnforceFocus
      disableRestoreFocus
      BackdropComponent={Backdrop}
      BackdropProps={{
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)'
        }
      }}
    >
      <div style={styles.container}>
        {stepContents && stepContents.length > 0 && (
          <div style={styles.contentContainer}>
            <div style={styles.carouselContainer}>
              {typeof stepContents[0] === 'function' && stepContents[0]({ onClose })}
              {typeof stepContents[0] !== 'function' && stepContents[0]}
            </div>
            {currentStep.withButtons && (
              <div style={styles.bottomContainer}>
                <Box style={styles.nexButtonContainer} justifyContent="center" display="flex">
                  <Button
                    // style={styles.nextButton}
                    variant="outlined"
                    size="large"
                    onClick={() => {
                      if (isFinalStep) {
                        onClose();
                      } else {
                        // swiperRef.current?.scrollBy(1, true);
                      }
                    }}
                  >{!isFinalStep ? 'next' : 'Got it'}</Button>
                </Box>
                {/* {!isFinalStep && !unskippable && (
                <Button
                  textOnly
                  text={t('appTour.skipButton')}
                  onPress={onClose}
                />
              )} */}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

const useStyles = () => {
  const BULLET_SAFE_AREA = 40;
  const theme = useTheme()

  return useCSS(() => ({
    modal: {
      // We disable the focus ring for mouse, touch and keyboard users.
      // At some point, it would be better to keep it for keyboard users.
      // :focus-ring CSS pseudo-class will help.
      outline: 'none',
      '& > :last-child': {
        // outline: 'none',
      },
    },
    container: {
      // flex: 1,
      width: '100%',
      height: '100%',
      // maxHeight: 600,
      display: 'flex',
    },
    contentContainer: {
      /**
       * Since the swiper use scrollView we are required to use flex on it
       * which means we cannot center anymore the top and bottom container anymore.
       * Playing with the flex ratio allows us to approach the "desired" placement from UX requirement.
       */
      display: 'flex',
      flex: 1,
      flexFlow: 'column',
    },
    svgContainer: {
      position: 'absolute',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    },
    carouselContainer: {
      // flex: 0.8,
      flex: 1,
      display: 'flex',
      // ...DeviceInfo.isTablet() && {
      //   flex: 0.45,
      // },
      // ...DeviceInfo.isTablet() && isLandscape && {
      //   flex: 0.6,
      // },
    },

    bottomContainer: {
      flex: 0.3,
      // ...DeviceInfo.isTablet() && {
      //   flexDirection: 'row-reverse',
      //   justifyContent: 'center',
      // },
    },
    nextButton: {
      width: 210,
    },
    stepContainer: {
      flex: 1,
      paddingBottom: BULLET_SAFE_AREA,
    },
    nexButtonContainer: { alignItems: 'center', marginBottom: 20 },
  }), [theme])
}