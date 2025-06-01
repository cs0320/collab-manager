import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const startSession = mutation({
  args: {},
  handler: async (ctx) => {
    // Set a session flag in a "sessions" table or similar
    await ctx.db.insert("sessions", {
        startedAt: new Date().toISOString(), endedAt: undefined,
        attendees: []
    });
    return { result: "success" };
  },
});

export const endSession = mutation({
  args: {},
  handler: async (ctx) => {
    // Mark the latest session as ended
    const sessions = await ctx.db.query("sessions").order("desc").collect();
    if (sessions.length > 0) {
      await ctx.db.patch(sessions[0]._id, { endedAt: new Date().toISOString() });
    }
    return { result: "success" };
  },
});