import type { StatusDto, UserDto } from "tweeter-shared";

export type StoryItem = {
  userAlias: string;
  timestamp: number;
  post: string;
  authorAlias: string;
  authorFirstName: string;
  authorLastName: string;
  authorImageUrl: string;
};

export type FeedItem = {
  ownerAlias: string;
  timestamp: number;
  post: string;
  authorAlias: string;
  authorFirstName: string;
  authorLastName: string;
  authorImageUrl: string;
};

export function statusToStoryItem(status: StatusDto): StoryItem {
  return {
    userAlias: status.user.alias,
    timestamp: status.timestamp,
    post: status.post,
    authorAlias: status.user.alias,
    authorFirstName: status.user.firstName,
    authorLastName: status.user.lastName,
    authorImageUrl: status.user.imageUrl,
  };
}

export function statusToFeedItem(
  ownerAlias: string,
  status: StatusDto,
): FeedItem {
  return {
    ownerAlias,
    timestamp: status.timestamp,
    post: status.post,
    authorAlias: status.user.alias,
    authorFirstName: status.user.firstName,
    authorLastName: status.user.lastName,
    authorImageUrl: status.user.imageUrl,
  };
}

export function storyItemToStatus(item: StoryItem): StatusDto {
  return {
    post: item.post,
    timestamp: item.timestamp,
    user: {
      alias: item.authorAlias,
      firstName: item.authorFirstName,
      lastName: item.authorLastName,
      imageUrl: item.authorImageUrl,
    },
  };
}

export function feedItemToStatus(item: FeedItem): StatusDto {
  return {
    post: item.post,
    timestamp: item.timestamp,
    user: {
      alias: item.authorAlias,
      firstName: item.authorFirstName,
      lastName: item.authorLastName,
      imageUrl: item.authorImageUrl,
    },
  };
}

export function userDtoToAuthorFields(
  user: UserDto,
): Pick<
  StoryItem,
  "authorAlias" | "authorFirstName" | "authorLastName" | "authorImageUrl"
> {
  return {
    authorAlias: user.alias,
    authorFirstName: user.firstName,
    authorLastName: user.lastName,
    authorImageUrl: user.imageUrl,
  };
}
