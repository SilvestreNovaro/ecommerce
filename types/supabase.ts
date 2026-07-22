export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          active: boolean
          created_at: string
          email: string
          full_name: string | null
          id: string
          permissions: Json | null
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_email: string | null
          admin_id: string | null
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_email: string
          customer_name: string
          customer_phone: string
          fulfillment: string
          id: string
          logistic_status: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          order_number: number
          paid_at: string | null
          payment_method: string
          payment_status: string
          promo_discount: number
          ship_address: string | null
          ship_city: string | null
          ship_notes: string | null
          ship_province: string | null
          ship_zip: string | null
          shipping_cost: number
          subtotal: number
          total: number
          transfer_discount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          fulfillment: string
          id?: string
          logistic_status?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          order_number?: never
          paid_at?: string | null
          payment_method: string
          payment_status?: string
          promo_discount?: number
          ship_address?: string | null
          ship_city?: string | null
          ship_notes?: string | null
          ship_province?: string | null
          ship_zip?: string | null
          shipping_cost?: number
          subtotal: number
          total: number
          transfer_discount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          fulfillment?: string
          id?: string
          logistic_status?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          order_number?: never
          paid_at?: string | null
          payment_method?: string
          payment_status?: string
          promo_discount?: number
          ship_address?: string | null
          ship_city?: string | null
          ship_notes?: string | null
          ship_province?: string | null
          ship_zip?: string | null
          shipping_cost?: number
          subtotal?: number
          total?: number
          transfer_discount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_orders: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          mp_preference_id: string | null
          order_id: string | null
          processed_at: string | null
          snapshot: Json
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          mp_preference_id?: string | null
          order_id?: string | null
          processed_at?: string | null
          snapshot: Json
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          mp_preference_id?: string | null
          order_id?: string | null
          processed_at?: string | null
          snapshot?: Json
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          orden: number
          product_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          orden?: number
          product_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          orden?: number
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category_id: string | null
          cost_price: number
          created_at: string
          description: string
          featured: boolean
          id: string
          image_url: string | null
          low_stock_threshold: number
          name: string
          price: number
          promo_price: number | null
          sku: string | null
          slug: string
          sort_order: number
          stock: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string
          featured?: boolean
          id?: string
          image_url?: string | null
          low_stock_threshold?: number
          name: string
          price: number
          promo_price?: number | null
          sku?: string | null
          slug: string
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string
          featured?: boolean
          id?: string
          image_url?: string | null
          low_stock_threshold?: number
          name?: string
          price?: number
          promo_price?: number | null
          sku?: string | null
          slug?: string
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          activo: boolean
          alcance: Database["public"]["Enums"]["promo_alcance"]
          cantidad_minima: number | null
          category_id: string | null
          created_at: string
          descripcion: string | null
          descuento_monto: number | null
          descuento_porcentaje: number | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          nombre: string
          nxm_compra: number | null
          nxm_paga: number | null
          product_id: string | null
          tipo: Database["public"]["Enums"]["promo_tipo"]
        }
        Insert: {
          activo?: boolean
          alcance?: Database["public"]["Enums"]["promo_alcance"]
          cantidad_minima?: number | null
          category_id?: string | null
          created_at?: string
          descripcion?: string | null
          descuento_monto?: number | null
          descuento_porcentaje?: number | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          nombre: string
          nxm_compra?: number | null
          nxm_paga?: number | null
          product_id?: string | null
          tipo: Database["public"]["Enums"]["promo_tipo"]
        }
        Update: {
          activo?: boolean
          alcance?: Database["public"]["Enums"]["promo_alcance"]
          cantidad_minima?: number | null
          category_id?: string | null
          created_at?: string
          descripcion?: string | null
          descuento_monto?: number | null
          descuento_porcentaje?: number | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          nombre?: string
          nxm_compra?: number | null
          nxm_paga?: number | null
          product_id?: string | null
          tipo?: Database["public"]["Enums"]["promo_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "promotions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          new_stock: number
          previous_stock: number
          product_id: string
          quantity: number
          reason: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_stock: number
          previous_stock: number
          product_id: string
          quantity: number
          reason?: string | null
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_stock?: number
          previous_stock?: number
          product_id?: string
          quantity?: number
          reason?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          id: number
          transfer_discount_enabled: boolean
          transfer_discount_pct: number
          updated_at: string
        }
        Insert: {
          id?: number
          transfer_discount_enabled?: boolean
          transfer_discount_pct?: number
          updated_at?: string
        }
        Update: {
          id?: number
          transfer_discount_enabled?: boolean
          transfer_discount_pct?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      admin_role: "admin" | "operador"
      promo_alcance: "todo" | "producto" | "categoria"
      promo_tipo: "porcentaje" | "monto_fijo" | "nxm" | "cantidad_minima"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      admin_role: ["admin", "operador"],
      promo_alcance: ["todo", "producto", "categoria"],
      promo_tipo: ["porcentaje", "monto_fijo", "nxm", "cantidad_minima"],
    },
  },
} as const
