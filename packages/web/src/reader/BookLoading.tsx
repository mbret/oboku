import { LinearProgress, Typography } from "@material-ui/core"

export const BookLoading = () => {

  return (
    <div style={{
      position: 'absolute',
      backgroundColor: 'white',
      top: 0,
      left: 0,
      height: '100%',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column'
    }}>
      <Typography gutterBottom>Your book is loading...</Typography>
      <LinearProgress style={{ width: 200 }}  />
    </div>
  )
}