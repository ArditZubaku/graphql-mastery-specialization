// Treat it like an in-memory event-bus

import { PubSub } from "graphql-subscriptions";

export const pubSub = new PubSub();
