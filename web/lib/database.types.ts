export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          parent_id: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          parent_id?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          parent_id?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content_json: Json;
          content_html: string;
          excerpt: string;
          cover_image: string | null;
          visibility: string;
          category_id: string | null;
          author_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          content_json?: Json;
          content_html?: string;
          excerpt?: string;
          cover_image?: string | null;
          visibility?: string;
          category_id?: string | null;
          author_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          content_json?: Json;
          content_html?: string;
          excerpt?: string;
          cover_image?: string | null;
          visibility?: string;
          category_id?: string | null;
          author_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      notes: {
        Row: {
          id: string;
          content_json: Json;
          content_html: string;
          source_url: string | null;
          images: string[];
          author_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content_json?: Json;
          content_html: string;
          source_url?: string | null;
          images?: string[];
          author_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content_json?: Json;
          content_html?: string;
          source_url?: string | null;
          images?: string[];
          author_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      api_tokens: {
        Row: {
          id: string;
          token_hash: string;
          name: string | null;
          owner_id: string;
          last_used_at: string | null;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          token_hash: string;
          name?: string | null;
          owner_id: string;
          last_used_at?: string | null;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          token_hash?: string;
          name?: string | null;
          owner_id?: string;
          last_used_at?: string | null;
          created_at?: string;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      pairing_tokens: {
        Row: {
          token: string;
          owner_id: string;
          expires_at: string;
          consumed: boolean;
          created_at: string;
          consumed_at: string | null;
        };
        Insert: {
          token: string;
          owner_id: string;
          expires_at?: string;
          consumed?: boolean;
          created_at?: string;
          consumed_at?: string | null;
        };
        Update: {
          token?: string;
          owner_id?: string;
          expires_at?: string;
          consumed?: boolean;
          created_at?: string;
          consumed_at?: string | null;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value?: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
