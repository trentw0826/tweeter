import { TweeterResponse } from "tweeter-shared";

export class ClientCommunicator {
  private readonly serverUrl: string;

  constructor(serverUrl?: string) {
    const configuredServerUrl =
      serverUrl ??
      (
        globalThis as typeof globalThis & {
          __APP_CONFIG__?: { VITE_API_BASE_URL?: string };
        }
      ).__APP_CONFIG__?.VITE_API_BASE_URL;

    if (!configuredServerUrl) {
      throw new Error(
        "API base URL not set. Please set VITE_API_BASE_URL in your .env file.",
      );
    }

    this.serverUrl = configuredServerUrl;
  }

  public async doPost<Req, Res extends TweeterResponse>(
    endpoint: string,
    request: Req,
  ): Promise<Res> {
    const response = await fetch(`${this.serverUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error ?? `Server error: ${response.status}`);
    }

    const data: Res = await response.json();

    if (!data.success) {
      throw new Error(data.message ?? "Unknown server error");
    }

    return data;
  }
}
