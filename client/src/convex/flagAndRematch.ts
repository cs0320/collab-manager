import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const flagAndRematch = mutation({
  args: {
    helpRequesterEmail: v.string(),
    debuggingPartnerEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // Mark the debugging partner as flagged and remove the pair
    const [dp] = await ctx.db
      .query("debuggingPartners")
      .filter((q) => q.eq(q.field("email"), args.debuggingPartnerEmail))
      .collect();
    if (dp) await ctx.db.patch(dp._id, { flagged: true });
    // Remove pairing logic here
    return { result: "success" };
  },
});