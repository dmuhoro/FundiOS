// Database types — mirror the schema in supabase/migrations/0001_initial_schema.sql.
// Placeholder until `npx supabase gen types typescript --local` runs against a
// live project; then replace this file wholesale with the generated output.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "owner" | "mechanic" | "receptionist" | "super_admin";
export type LeadSource =
  | "whatsapp"
  | "facebook"
  | "walk_in"
  | "referral"
  | "google"
  | "other";
export type LeadStatus = "new" | "contacted" | "converted" | "lost";
export type ServiceStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type PaymentMethod = "cash" | "mpesa" | "card" | "invoice";
export type PlanTier = "starter" | "growth" | "premium";
export type AutomationTrigger =
  | "whatsapp_inbound"
  | "lead_created"
  | "service_completed"
  | "reminder_due"
  | "campaign_fired"
  | "agent_action";
export type AutomationStatus = "success" | "failed" | "skipped" | "pending";

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          plan_tier: PlanTier;
          wa_phone_id: string | null;
          wa_access_token: string | null;
          meta_verified: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          plan_tier?: PlanTier;
          wa_phone_id?: string | null;
          wa_access_token?: string | null;
          meta_verified?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          garage_id: string | null;
          name: string;
          phone: string | null;
          role: UserRole;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          garage_id?: string | null;
          name: string;
          phone?: string | null;
          role?: UserRole;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "users_garage_id_fkey";
            columns: ["garage_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      customers: {
        Row: {
          id: string;
          garage_id: string;
          name: string;
          phone: string;
          email: string | null;
          notes: string | null;
          wa_opt_in: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          garage_id: string;
          name: string;
          phone: string;
          email?: string | null;
          notes?: string | null;
          wa_opt_in?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "customers_garage_id_fkey";
            columns: ["garage_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      vehicles: {
        Row: {
          id: string;
          garage_id: string;
          customer_id: string;
          make: string;
          model: string;
          year: number | null;
          plate_number: string | null;
          color: string | null;
          mileage_km: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          garage_id: string;
          customer_id: string;
          make: string;
          model: string;
          year?: number | null;
          plate_number?: string | null;
          color?: string | null;
          mileage_km?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vehicles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "vehicles_garage_id_fkey";
            columns: ["garage_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicles_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };
      services: {
        Row: {
          id: string;
          garage_id: string;
          customer_id: string;
          vehicle_id: string;
          description: string;
          status: ServiceStatus;
          amount_kes: number | null;
          paid: boolean;
          payment_method: PaymentMethod | null;
          appointment_at: string | null;
          completed_at: string | null;
          next_service_km: number | null;
          next_service_at: string | null;
          reminder_sent: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          garage_id: string;
          customer_id: string;
          vehicle_id: string;
          description: string;
          status?: ServiceStatus;
          amount_kes?: number | null;
          paid?: boolean;
          payment_method?: PaymentMethod | null;
          appointment_at?: string | null;
          completed_at?: string | null;
          next_service_km?: number | null;
          next_service_at?: string | null;
          reminder_sent?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "services_garage_id_fkey";
            columns: ["garage_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "services_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "services_vehicle_id_fkey";
            columns: ["vehicle_id"];
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          }
        ];
      };
      leads: {
        Row: {
          id: string;
          garage_id: string;
          name: string | null;
          phone: string;
          vehicle_make: string | null;
          vehicle_model: string | null;
          message: string | null;
          source: LeadSource;
          status: LeadStatus;
          converted_to: string | null;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          garage_id: string;
          name?: string | null;
          phone: string;
          vehicle_make?: string | null;
          vehicle_model?: string | null;
          message?: string | null;
          source?: LeadSource;
          status?: LeadStatus;
          converted_to?: string | null;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "leads_garage_id_fkey";
            columns: ["garage_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_converted_to_fkey";
            columns: ["converted_to"];
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_assigned_to_fkey";
            columns: ["assigned_to"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      automation_logs: {
        Row: {
          id: string;
          garage_id: string;
          trigger_type: AutomationTrigger;
          entity_type: string | null;
          entity_id: string | null;
          action: string;
          payload: Json | null;
          status: AutomationStatus;
          error_message: string | null;
          idempotency_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          garage_id: string;
          trigger_type: AutomationTrigger;
          entity_type?: string | null;
          entity_id?: string | null;
          action: string;
          payload?: Json | null;
          status?: AutomationStatus;
          error_message?: string | null;
          idempotency_key?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["automation_logs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "automation_logs_garage_id_fkey";
            columns: ["garage_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      campaigns: {
        Row: {
          id: string;
          garage_id: string;
          name: string;
          type: string | null;
          status: string;
          budget_kes: number | null;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          garage_id: string;
          name: string;
          type?: string | null;
          status?: string;
          budget_kes?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "campaigns_garage_id_fkey";
            columns: ["garage_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_garage_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
    };
    Enums: {
      user_role: UserRole;
      lead_source: LeadSource;
      lead_status: LeadStatus;
      service_status: ServiceStatus;
      payment_method: PaymentMethod;
      plan_tier: PlanTier;
      automation_trigger: AutomationTrigger;
      automation_status: AutomationStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}