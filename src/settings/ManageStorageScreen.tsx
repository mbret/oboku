import React, { useEffect, useState } from 'react';
import { TopBarNavigation } from '../TopBarNavigation';
import { makeStyles, ListItem, List, ListItemText, ListItemAvatar, createStyles, Theme, LinearProgress } from '@material-ui/core';
import { StorageRounded } from '@material-ui/icons';

interface ChromeStorageEstimate extends StorageEstimate {
  usageDetails?: {
    indexedDB: number
  }
}

export const ManageStorageScreen = () => {
  const classes = useStyles();
  const [storageQuota, setStorageQuota] = useState<number | undefined>(undefined)
  const [indexedDBUsage, setIndexedDBUsage] = useState<number | undefined>(undefined)

  useEffect(() => {
    navigator.storage.estimate().then((estimate) => {
      const estimateIndexedDBUsage = (estimate as ChromeStorageEstimate)?.usageDetails?.indexedDB
      estimate.quota && setStorageQuota(estimate.quota)
      estimateIndexedDBUsage && setIndexedDBUsage(estimateIndexedDBUsage)
    });

  }, [])

  const quotaUsed = (indexedDBUsage || 1) / (storageQuota || 1)
  const usedInMb = ((indexedDBUsage || 1) / 1e+6).toFixed(2)
  const quotaInGb = ((storageQuota || 1) / 1e+9).toFixed(2)

  return (
    <>
      <TopBarNavigation title={'Manage storage'} />
      <List className={classes.root}>
        <ListItem>
          <ListItemAvatar>
            <StorageRounded />
          </ListItemAvatar>
          <ListItemText
            primary="Available storage"
            secondary={
              <>
                <LinearProgress variant="determinate" value={quotaUsed * 100} />
                {`${usedInMb} MB (${(quotaUsed * 100).toFixed(2)}%) used of ${quotaInGb} GB`}
              </>
            }
          />
        </ListItem>
      </List>
    </>
  );
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      // width: '100%',
      // maxWidth: 360,
      // backgroundColor: theme.palette.background.paper,
    },
  }),
);