export enum FirstTimeExperienceId {
  APP_TOUR_FIRST_TOUR_TAGS = 'APP_TOUR_FIRST_TOUR_TAGS',
  APP_TOUR_READER = 'APP_TOUR_READER',
  APP_TOUR_FIRST_ADDING_BOOK = 'APP_TOUR_FIRST_ADDING_BOOK',
  APP_TOUR_WELCOME = 'APP_TOUR_WELCOME',
}

export const FirstTimeExperience = [
  {
    id: FirstTimeExperienceId.APP_TOUR_FIRST_TOUR_TAGS,
    version: 1,
  },
  {
    id: FirstTimeExperienceId.APP_TOUR_WELCOME,
    version: 1,
  },
  {
    id: FirstTimeExperienceId.APP_TOUR_READER,
    version: 1,
  },
  {
    id: FirstTimeExperienceId.APP_TOUR_FIRST_ADDING_BOOK,
    version: 1,
  }
]