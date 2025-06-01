import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const escalate = mutation({
  args: { helpRequesterEmail: v.string() },
  handler: async (ctx, args) => {
    // Mark the help requester as escalated
    const [hr] = await ctx.db
      .query("helpRequesters")
      .filter((q) => q.eq(q.field("email"), args.helpRequesterEmail))
      .collect();
    if (hr) await ctx.db.patch(hr._id, { escalated: true });
    return { result: "success" };
  },
});