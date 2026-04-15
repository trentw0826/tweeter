import type { Dao } from "./Dao.js";

export type QueueMessage = {
  id: string;
  body: string;
};

export interface SqsPublisher extends Dao {
  sendMessage(queueUrl: string, body: string): Promise<void>;

  sendMessageBatch(queueUrl: string, messages: QueueMessage[]): Promise<void>;
}
