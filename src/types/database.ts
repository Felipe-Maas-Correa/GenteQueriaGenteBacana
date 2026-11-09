/**
 * Tipos do banco de dados (schema `public`).
 *
 * Mantidos manualmente em sincronia com `supabase/migrations`. Com a CLI do
 * Supabase disponível, este arquivo pode ser regenerado com:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SubscriberStatus = "active" | "inactive"
export type UserRole = "admin" | "editor" | "pending"

export type Database = {
  public: {
    Tables: {
      areas: {
        Row: {
          id: string
          name: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          id: string
          name: string
          address: string
          phone: string
          area_id: string
          due_date: string
          due_day: number
          reference_month: number
          observation: string
          status: SubscriberStatus
          label_enabled: boolean
          search_text: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          phone?: string
          area_id: string
          due_date: string
          reference_month: number
          observation?: string
          status?: SubscriberStatus
          label_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          phone?: string
          area_id?: string
          due_date?: string
          reference_month?: number
          observation?: string
          status?: SubscriberStatus
          label_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscribers_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string
          email: string
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      subscriber_status: SubscriberStatus
      user_role: UserRole
    }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
