import type { StatusDto } from "tweeter-shared";
import { AWSSqsPublisher, DaoFactory } from "../../data-access/index.js";
import { FeedFanoutService } from "../../model/service/FeedFanoutService.js";

type PostStatusQueueMessage = {
  status: StatusDto;
};

type SqsRecord = {
  body: string;
};

type SqsEvent = {
  Records?: SqsRecord[];
};

export const handler = async (event: SqsEvent): Promise<void> => {
  const queueUrl = process.env.UPDATE_FEED_QUEUE_URL;
  if (queueUrl === undefined || queueUrl.trim().length === 0) {
    throw new Error("Missing UPDATE_FEED_QUEUE_URL configuration");
  }

  const fanoutService = new FeedFanoutService({
    daoFactory: DaoFactory.getInstance(),
    sqsPublisher: new AWSSqsPublisher(),
  });

  for (const record of event.Records ?? []) {
    const message = JSON.parse(record.body) as PostStatusQueueMessage;
    await fanoutService.enqueueFeedUpdatesForStatus(message.status, queueUrl);
  }
};
