/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as customers from "../customers.js";
import type * as dashboard from "../dashboard.js";
import type * as http from "../http.js";
import type * as leads from "../leads.js";
import type * as lib_authorization from "../lib/authorization.js";
import type * as lib_automation from "../lib/automation.js";
import type * as lib_jobs from "../lib/jobs.js";
import type * as lib_landing from "../lib/landing.js";
import type * as lib_phone from "../lib/phone.js";
import type * as lib_whatsapp from "../lib/whatsapp.js";
import type * as lib_whatsappSender from "../lib/whatsappSender.js";
import type * as members from "../members.js";
import type * as queue from "../queue.js";
import type * as reminders from "../reminders.js";
import type * as services from "../services.js";
import type * as site from "../site.js";
import type * as tenants from "../tenants.js";
import type * as vehicles from "../vehicles.js";
import type * as whatsapp from "../whatsapp.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  crons: typeof crons;
  customers: typeof customers;
  dashboard: typeof dashboard;
  http: typeof http;
  leads: typeof leads;
  "lib/authorization": typeof lib_authorization;
  "lib/automation": typeof lib_automation;
  "lib/jobs": typeof lib_jobs;
  "lib/landing": typeof lib_landing;
  "lib/phone": typeof lib_phone;
  "lib/whatsapp": typeof lib_whatsapp;
  "lib/whatsappSender": typeof lib_whatsappSender;
  members: typeof members;
  queue: typeof queue;
  reminders: typeof reminders;
  services: typeof services;
  site: typeof site;
  tenants: typeof tenants;
  vehicles: typeof vehicles;
  whatsapp: typeof whatsapp;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
