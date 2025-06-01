import { query } from "./_generated/server";

export const getInfo = query({
  args: {},
  handler: async (ctx) => {
    const helpRequesters = await ctx.db.query("helpRequesters").collect();
    const debuggingPartners = await ctx.db.query("debuggingPartners").collect();
    // Add logic for pairing, session state, etc.
    return { helpRequesters, debuggingPartners };
  },
});