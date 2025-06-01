import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const addHelpRequester = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    bugType: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("helpRequesters", {
      name: args.name,
      email: args.email,
      joinedTime: new Date().toISOString(),
      pairAtTime: undefined,
      assignedDebuggingPartnerName: undefined,
      bugType: args.bugType,
    });
    return { result: "success" };
  },
});