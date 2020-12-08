import { useRxMutation } from "../rxdb";

export const useResetFirstTimeExperience = () =>
  useRxMutation(db => db.auth.safeUpdate({
    $set: {
      hasDoneReaderTour: false,
      hasDoneWelcomeTour: false,
    }
  }, collection => collection.findOne()))