'use client';

import { ConvexProvider as ConvexProviderBase } from "convex/react";
import { ConvexClient } from "convex/browser";

const convex = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

export default function ConvexProvider({ children }) {
  return (
    <ConvexProviderBase client={convex}>
      {children}
    </ConvexProviderBase>
  );
}

