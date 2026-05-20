import Razorpay from 'razorpay';

let cachedClient: Razorpay | null = null;

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getClient = (): Razorpay => {
  if (cachedClient) return cachedClient;
  cachedClient = new Razorpay({
    key_id: getEnv('RAZORPAY_KEY_ID'),
    key_secret: getEnv('RAZORPAY_KEY_SECRET'),
  });
  return cachedClient;
};

export interface CreateSubscriptionInput {
  planId: string;
  totalCount: number;
  notes: Record<string, string>;
}

export interface CreatedSubscription {
  id: string;
  shortUrl: string;
  status: string;
}

export const RazorpayService = {
  getPublicKeyId(): string {
    return getEnv('RAZORPAY_KEY_ID');
  },

  getPlanId(): string {
    return getEnv('RAZORPAY_PLAN_ID');
  },

  async createSubscription(input: CreateSubscriptionInput): Promise<CreatedSubscription> {
    const client = getClient();
    const sub = (await client.subscriptions.create({
      plan_id: input.planId,
      customer_notify: 1,
      total_count: input.totalCount,
      notes: input.notes,
    })) as { id: string; short_url: string; status: string };

    return {
      id: sub.id,
      shortUrl: sub.short_url,
      status: sub.status,
    };
  },

  async cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean): Promise<void> {
    const client = getClient();
    await client.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
  },
};
