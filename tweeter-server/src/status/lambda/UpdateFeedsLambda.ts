import type { StatusDto } from "tweeter-shared";
import { StatusService } from "../../model/service/StatusService.js";

type FeedUpdateQueueMessage = {
  status: StatusDto;
  followerAliases: string[];
};

type SqsRecord = {
  body: string;
};

type SqsEvent = {
  Records?: SqsRecord[];
};

export const handler = async (event: SqsEvent): Promise<void> => {
  const statusService = new StatusService();

  for (const record of event.Records ?? []) {
    const message = JSON.parse(record.body) as FeedUpdateQueueMessage;
    await statusService.addStatusToFeeds(
      message.followerAliases,
      message.status,
    );
  }
};
