import { SortQuery } from "./../../../types/types.d";

export const sortRequest = (sort?: string) => {
  let sortQuery: SortQuery = {
    $sort: { createdAt: -1 },
  };

  if (sort) {
    const sortPattern = sort.toLowerCase().trim().split("_");

    const sortRange = sortPattern[1] === "desc" ? 1 : -1;

    sortQuery = {
      $sort: {
        [sortPattern[0]]: sortRange,
      },
    };
  }

  return sortQuery;
};
