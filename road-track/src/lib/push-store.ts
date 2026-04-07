const subscriptions: Map<string, PushSubscription> = new Map();

export function getSubscriptions() {
  return subscriptions;
}

export function addSubscription(endpoint: string, subscription: PushSubscription) {
  subscriptions.set(endpoint, subscription);
}

export function removeSubscription(endpoint: string) {
  subscriptions.delete(endpoint);
}

export function getSubscriptionCount() {
  return subscriptions.size;
}
