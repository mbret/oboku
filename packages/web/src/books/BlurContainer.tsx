import { useCSS } from '../common/utils';
// needs to be global
import './BlurContainer.css';

export const BlurContainer = () => {
  const classes = useStyle()

  return (
    <svg style={classes.hideSvgSoThatItSupportsFirefox}>
      <filter id='sharpBlur'>
        <feGaussianBlur stdDeviation='5'></feGaussianBlur>
        <feColorMatrix type='matrix' values='1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 9 0'></feColorMatrix>
        <feComposite in2='SourceGraphic' operator='in'></feComposite>
      </filter>
    </svg>
  )
}

const useStyle = () => {
  return useCSS(() => ({
    hideSvgSoThatItSupportsFirefox: {
      border: 0,
      clip: 'rect(0 0 0 0)',
      height: 1,
      margin: -1,
      overflow: 'hidden',
      padding: 0,
      position: 'absolute',
      width: 1,
    }
  }), [])
}