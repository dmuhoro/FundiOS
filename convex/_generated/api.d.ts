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
import type * as customers from "../customers.js";
import type * as http from "../http.js";
import type * as leads from "../leads.js";
import type * as lib_authorization from "../lib/authorization.js";
import type * as lib_automation from "../lib/automation.js";
import type * as lib_phone from "../lib/phone.js";
import type * as lib_whatsapp from "../lib/whatsapp.js";
import type * as members from "../members.js";
import type * as services from "../services.js";
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
  customers: typeof customers;
  http: typeof http;
  leads: typeof leads;
  "lib/authorization": typeof lib_authorization;
  "lib/automation": typeof lib_automation;
  "lib/phone": typeof lib_phone;
  "lib/whatsapp": typeof lib_whatsapp;
  members: typeof members;
  services: typeof services;
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
