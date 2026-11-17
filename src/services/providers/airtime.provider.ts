export interface AirtimeProvider {
  topup(input: { msisdn: string; sku: string; orderId: string }): Promise<{ ref: string }>;
  query(orderId: string): Promise<"success" | "failed" | "pending">;
}

export class MockAirtimeProvider implements AirtimeProvider {
  async topup(input: { msisdn: string; sku: string; orderId: string }) {
    if (input.msisdn.endsWith("0000")) {
      throw new Error("provider_declined");
    }
    return { ref: `MOCK-${input.orderId.slice(0, 8)}` };
  }

  async query(): Promise<"success" | "failed" | "pending"> {
    return "pending";
  }
}

export class LiveAirtimeProvider implements AirtimeProvider {
  async topup(): Promise<{ ref: string }> {
    throw new Error("generic");
  }

  async query(): Promise<"success" | "failed" | "pending"> {
    return "pending";
  }
}

export function getAirtimeProvider(): AirtimeProvider {
  if (process.env.AIRTIME_MODE === "live") return new LiveAirtimeProvider();
  return new MockAirtimeProvider();
}
