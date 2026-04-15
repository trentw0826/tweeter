import {
  SQSClient,
  SendMessageBatchCommand,
  SendMessageCommand,
} from "@aws-sdk/client-sqs";
import type { QueueMessage, SqsPublisher } from "./SqsPublisher.js";

export class AWSSqsPublisher implements SqsPublisher {
  private static client: SQSClient | null = null;

  private get client(): SQSClient {
    if (AWSSqsPublisher.client === null) {
      AWSSqsPublisher.client = new SQSClient({});
    }

    return AWSSqsPublisher.client;
  }

  async initialize(): Promise<void> {
    this.client;
  }

  async close(): Promise<void> {
    return Promise.resolve();
  }

  async sendMessage(queueUrl: string, body: string): Promise<void> {
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: body,
      }),
    );
  }

  async sendMessageBatch(
    queueUrl: string,
    messages: QueueMessage[],
  ): Promise<void> {
    if (messages.length === 0) {
      return;
    }

    const response = await this.client.send(
      new SendMessageBatchCommand({
        QueueUrl: queueUrl,
        Entries: messages.map((message) => ({
          Id: message.id,
          MessageBody: message.body,
        })),
      }),
    );

    if ((response.Failed?.length ?? 0) > 0) {
      const details = response.Failed?.map(
        (entry) => `${entry.Id ?? "unknown"}:${entry.Code ?? "unknown"}`,
      ).join(", ");
      throw new Error(`SQS batch send failed for ${details}`);
    }
  }
}
