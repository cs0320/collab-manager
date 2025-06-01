/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as addDebuggingPartner from "../addDebuggingPartner.js";
import type * as addHelpRequester from "../addHelpRequester.js";
import type * as escalate from "../escalate.js";
import type * as flagAndRematch from "../flagAndRematch.js";
import type * as getInfo from "../getInfo.js";
import type * as removeFromQueue from "../removeFromQueue.js";
import type * as session from "../session.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  addDebuggingPartner: typeof addDebuggingPartner;
  addHelpRequester: typeof addHelpRequester;
  escalate: typeof escalate;
  flagAndRematch: typeof flagAndRematch;
  getInfo: typeof getInfo;
  removeFromQueue: typeof removeFromQueue;
  session: typeof session;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
