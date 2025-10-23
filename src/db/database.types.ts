export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      event_management_logs: {
        Row: {
          action_type: Database["public"]["Enums"]["event_action_type"];
          created_at: string;
          event_id: string | null;
          id: string;
          user_id: string | null;
        };
        Insert: {
          action_type: Database["public"]["Enums"]["event_action_type"];
          created_at?: string;
          event_id?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          action_type?: Database["public"]["Enums"]["event_action_type"];
          created_at?: string;
          event_id?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_management_logs_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          age_category: Database["public"]["Enums"]["age_category"];
          category: Database["public"]["Enums"]["event_category"];
          city: string;
          created_at: string;
          created_by_authenticated_user: boolean;
          edited_description: string | null;
          event_date: string;
          feedback: Database["public"]["Enums"]["feedback"] | null;
          generated_description: string;
          id: string;
          key_information: string;
          model_version: string;
          saved: boolean;
          title: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          age_category: Database["public"]["Enums"]["age_category"];
          category: Database["public"]["Enums"]["event_category"];
          city: string;
          created_at?: string;
          created_by_authenticated_user?: boolean;
          edited_description?: string | null;
          event_date: string;
          feedback?: Database["public"]["Enums"]["feedback"] | null;
          generated_description: string;
          id?: string;
          key_information: string;
          model_version: string;
          saved?: boolean;
          title: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          age_category?: Database["public"]["Enums"]["age_category"];
          category?: Database["public"]["Enums"]["event_category"];
          city?: string;
          created_at?: string;
          created_by_authenticated_user?: boolean;
          edited_description?: string | null;
          event_date?: string;
          feedback?: Database["public"]["Enums"]["feedback"] | null;
          generated_description?: string;
          id?: string;
          key_information?: string;
          model_version?: string;
          saved?: boolean;
          title?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      user_activity_logs: {
        Row: {
          action_type: Database["public"]["Enums"]["user_action_type"];
          created_at: string;
          id: string;
          user_id: string | null;
        };
        Insert: {
          action_type: Database["public"]["Enums"]["user_action_type"];
          created_at?: string;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          action_type?: Database["public"]["Enums"]["user_action_type"];
          created_at?: string;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      age_category:
        | "wszystkie"
        | "najmlodsi"
        | "dzieci"
        | "nastolatkowie"
        | "mlodzi_dorosli"
        | "dorosli"
        | "osoby_starsze";
      event_action_type: "event_created" | "event_saved" | "event_edited" | "event_deleted" | "event_rated";
      event_category:
        | "koncerty"
        | "imprezy"
        | "teatr_i_taniec"
        | "sztuka_i_wystawy"
        | "literatura"
        | "kino"
        | "festiwale"
        | "inne";
      feedback: "thumbs_up" | "thumbs_down";
      user_action_type: "account_created" | "account_deleted" | "password_changed" | "login" | "logout";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      age_category: ["wszystkie", "najmlodsi", "dzieci", "nastolatkowie", "mlodzi_dorosli", "dorosli", "osoby_starsze"],
      event_action_type: ["event_created", "event_saved", "event_edited", "event_deleted"],
      event_category: [
        "koncerty",
        "imprezy",
        "teatr_i_taniec",
        "sztuka_i_wystawy",
        "literatura",
        "kino",
        "festiwale",
        "inne",
      ],
      feedback: ["thumbs_up", "thumbs_down"],
      user_action_type: ["account_created", "account_deleted", "password_changed", "login", "logout"],
    },
  },
} as const;
