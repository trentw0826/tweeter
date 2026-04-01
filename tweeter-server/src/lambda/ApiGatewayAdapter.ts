type EventWithBody = {
  body?: string | Record<string, unknown> | null;
};

type ApiGatewayResponse = {
  statusCode: number;
  headers: {
    "Access-Control-Allow-Origin": string;
    "Content-Type": string;
  };
  body: string;
};

const errorStatusCode = (message: string): number => {
  const lowered = message.toLowerCase();

  if (lowered.includes("[bad-request]") || lowered.includes("bad-request")) {
    return 400;
  }

  if (lowered.includes("[unauthorized]") || lowered.includes("unauthorized")) {
    return 401;
  }

  return 500;
};

const jsonResponse = (
  statusCode: number,
  payload: unknown,
): ApiGatewayResponse => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const parseBody = <Request>(event: unknown): Request => {
  if (event && typeof event === "object" && "body" in event) {
    const body = (event as EventWithBody).body;

    if (typeof body === "string") {
      if (body.length === 0) {
        return {} as Request;
      }

      try {
        return JSON.parse(body) as Request;
      } catch {
        throw new Error("[bad-request] Invalid JSON request body");
      }
    }

    if (body && typeof body === "object") {
      return body as Request;
    }

    return {} as Request;
  }

  // Backward-compatible fallback for direct invocation in tests/tools.
  return (event ?? {}) as Request;
};

export const createApiGatewayHandler = <Request, Response>(
  operation: (request: Request) => Promise<Response>,
) => {
  return async (event: unknown): Promise<ApiGatewayResponse> => {
    try {
      const request = parseBody<Request>(event);
      const response = await operation(request);
      return jsonResponse(200, response);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal server error";
      return jsonResponse(errorStatusCode(message), {
        success: false,
        message,
      });
    }
  };
};
