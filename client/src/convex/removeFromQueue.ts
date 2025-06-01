import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const removeFromQueue = mutation({
  args: { email: v.string(), role: v.string() },
  handler: async (ctx, args) => {
    if (args.role === "helpRequester") {
      const [hr] = await ctx.db
        .query("helpRequesters")
        .filter((q) => q.eq(q.field("email"), args.email))
        .collect();
      if (hr) await ctx.db.delete(hr._id);
    } else if (args.role === "debuggingPartner") {
      const [dp] = await ctx.db
        .query("debuggingPartners")
        .filter((q) => q.eq(q.field("email"), args.email))
        .collect();
      if (dp) await ctx.db.delete(dp._id);
    }
    return { result: "success" };
  },
});