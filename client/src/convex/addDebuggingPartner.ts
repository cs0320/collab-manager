import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const addDebuggingPartner = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("debuggingPartners", {
      name: args.name,
      email: args.email,
      joinedTime: new Date().toISOString(),
      lastPairedAtTime: undefined,
      helpRequestersSeen: 0,
    });
    return { result: "success" };
  },
});