import { AppTourFirstTourTags } from "./AppTourFirstTourTags";
import { AppTourFirstAddingBook } from "./AppTourFirstAddingBook";
import { AppTourWelcome } from "./AppTourWelcome";

export const FirstTimeExperienceTours = () => (
  <>
    <AppTourWelcome />
    <AppTourFirstTourTags />
    <AppTourFirstAddingBook />
  </>
)