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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agencies: {
        Row: {
          about_text: string | null
          address_line1: string | null
          address_line2: string | null
          brand_color: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: string | null
          currency_symbol: string | null
          dark_color: string | null
          default_notice_period: string | null
          default_revision_rounds: number | null
          default_template: string | null
          default_validity_days: number | null
          email: string | null
          hourly_rate: number | null
          id: string
          logo_url: string | null
          name: string
          onboarding_complete: boolean | null
          onboarding_step: number | null
          phone: string | null
          proposal_counter: number | null
          proposal_prefix: string | null
          scrape_status: string | null
          scrape_url: string | null
          scraped_at: string | null
          scraped_data: Json | null
          secondary_color: string | null
          state: string | null
          tagline: string | null
          team_members: Json | null
          website: string | null
          years_experience: number | null
          zip: string | null
        }
        Insert: {
          about_text?: string | null
          address_line1?: string | null
          address_line2?: string | null
          brand_color?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          currency_symbol?: string | null
          dark_color?: string | null
          default_notice_period?: string | null
          default_revision_rounds?: number | null
          default_template?: string | null
          default_validity_days?: number | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          logo_url?: string | null
          name: string
          onboarding_complete?: boolean | null
          onboarding_step?: number | null
          phone?: string | null
          proposal_counter?: number | null
          proposal_prefix?: string | null
          scrape_status?: string | null
          scrape_url?: string | null
          scraped_at?: string | null
          scraped_data?: Json | null
          secondary_color?: string | null
          state?: string | null
          tagline?: string | null
          team_members?: Json | null
          website?: string | null
          years_experience?: number | null
          zip?: string | null
        }
        Update: {
          about_text?: string | null
          address_line1?: string | null
          address_line2?: string | null
          brand_color?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          currency_symbol?: string | null
          dark_color?: string | null
          default_notice_period?: string | null
          default_revision_rounds?: number | null
          default_template?: string | null
          default_validity_days?: number | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          onboarding_complete?: boolean | null
          onboarding_step?: number | null
          phone?: string | null
          proposal_counter?: number | null
          proposal_prefix?: string | null
          scrape_status?: string | null
          scrape_url?: string | null
          scraped_at?: string | null
          scraped_data?: Json | null
          secondary_color?: string | null
          state?: string | null
          tagline?: string | null
          team_members?: Json | null
          website?: string | null
          years_experience?: number | null
          zip?: string | null
        }
        Relationships: []
      }
      bundle_modules: {
        Row: {
          bundle_id: string | null
          id: string
          module_id: string | null
        }
        Insert: {
          bundle_id?: string | null
          id?: string
          module_id?: string | null
        }
        Update: {
          bundle_id?: string | null
          id?: string
          module_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bundle_modules_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "service_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_template_modules: {
        Row: {
          bundle_template_id: string | null
          id: string
          module_name: string
        }
        Insert: {
          bundle_template_id?: string | null
          id?: string
          module_name: string
        }
        Update: {
          bundle_template_id?: string | null
          id?: string
          module_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_template_modules_bundle_template_id_fkey"
            columns: ["bundle_template_id"]
            isOneToOne: false
            referencedRelation: "bundle_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_templates: {
        Row: {
          description: string | null
          discount_percentage: number | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          tagline: string | null
        }
        Insert: {
          description?: string | null
          discount_percentage?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          tagline?: string | null
        }
        Update: {
          description?: string | null
          discount_percentage?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          tagline?: string | null
        }
        Relationships: []
      }
      bundles: {
        Row: {
          agency_id: string | null
          bundle_price: number | null
          created_at: string
          description: string | null
          id: string
          individual_total: number | null
          is_active: boolean | null
          name: string
          savings_amount: number | null
          savings_label: string | null
          tagline: string | null
        }
        Insert: {
          agency_id?: string | null
          bundle_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          individual_total?: number | null
          is_active?: boolean | null
          name: string
          savings_amount?: number | null
          savings_label?: string | null
          tagline?: string | null
        }
        Update: {
          agency_id?: string | null
          bundle_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          individual_total?: number | null
          is_active?: boolean | null
          name?: string
          savings_amount?: number | null
          savings_label?: string | null
          tagline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bundles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          about_summary: string | null
          address: string | null
          agency_id: string | null
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_title: string | null
          created_at: string
          id: string
          industry: string | null
          logo_url: string | null
          notes: string | null
          phone: string | null
          website: string | null
        }
        Insert: {
          about_summary?: string | null
          address?: string | null
          agency_id?: string | null
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_title?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          logo_url?: string | null
          notes?: string | null
          phone?: string | null
          website?: string | null
        }
        Update: {
          about_summary?: string | null
          address?: string | null
          agency_id?: string | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_title?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          logo_url?: string | null
          notes?: string | null
          phone?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      differentiators: {
        Row: {
          agency_id: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          source: string | null
          stat_label: string | null
          stat_value: string | null
          title: string
        }
        Insert: {
          agency_id?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          source?: string | null
          stat_label?: string | null
          stat_value?: string | null
          title: string
        }
        Update: {
          agency_id?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          source?: string | null
          stat_label?: string | null
          stat_value?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "differentiators_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          agency_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          proposal_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          agency_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          proposal_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          agency_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          proposal_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_templates: {
        Row: {
          agency_id: string | null
          id: string
          is_default: boolean | null
          milestones: Json
          name: string
        }
        Insert: {
          agency_id?: string | null
          id?: string
          is_default?: boolean | null
          milestones: Json
          name: string
        }
        Update: {
          agency_id?: string | null
          id?: string
          is_default?: boolean | null
          milestones?: Json
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_templates_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          agency_id: string | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          images: Json | null
          is_active: boolean | null
          results: string | null
          sort_order: number | null
          source_url: string | null
          title: string
        }
        Insert: {
          agency_id?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          results?: string | null
          sort_order?: number | null
          source_url?: string | null
          title: string
        }
        Update: {
          agency_id?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          results?: string | null
          sort_order?: number | null
          source_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_analytics: {
        Row: {
          created_at: string
          duration_seconds: number | null
          event_type: string
          id: string
          ip_address: string | null
          proposal_id: string | null
          section_name: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          event_type: string
          id?: string
          ip_address?: string | null
          proposal_id?: string | null
          section_name?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          event_type?: string
          id?: string
          ip_address?: string | null
          proposal_id?: string | null
          section_name?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_analytics_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_portfolio: {
        Row: {
          id: string
          portfolio_item_id: string | null
          proposal_id: string | null
          sort_order: number | null
        }
        Insert: {
          id?: string
          portfolio_item_id?: string | null
          proposal_id?: string | null
          sort_order?: number | null
        }
        Update: {
          id?: string
          portfolio_item_id?: string | null
          proposal_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_portfolio_portfolio_item_id_fkey"
            columns: ["portfolio_item_id"]
            isOneToOne: false
            referencedRelation: "portfolio_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_portfolio_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_services: {
        Row: {
          bundle_id: string | null
          client_responsibilities: string[] | null
          custom_deliverables: string[] | null
          custom_description: string | null
          display_order: number | null
          id: string
          is_addon: boolean | null
          module_id: string | null
          out_of_scope: string[] | null
          price_override: number | null
          pricing_model_override: string | null
          proposal_id: string | null
          show_out_of_scope: boolean | null
          show_responsibilities: boolean | null
        }
        Insert: {
          bundle_id?: string | null
          client_responsibilities?: string[] | null
          custom_deliverables?: string[] | null
          custom_description?: string | null
          display_order?: number | null
          id?: string
          is_addon?: boolean | null
          module_id?: string | null
          out_of_scope?: string[] | null
          price_override?: number | null
          pricing_model_override?: string | null
          proposal_id?: string | null
          show_out_of_scope?: boolean | null
          show_responsibilities?: boolean | null
        }
        Update: {
          bundle_id?: string | null
          client_responsibilities?: string[] | null
          custom_deliverables?: string[] | null
          custom_description?: string | null
          display_order?: number | null
          id?: string
          is_addon?: boolean | null
          module_id?: string | null
          out_of_scope?: string[] | null
          price_override?: number | null
          pricing_model_override?: string | null
          proposal_id?: string | null
          show_out_of_scope?: boolean | null
          show_responsibilities?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_services_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_services_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "service_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_services_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_shares: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          proposal_id: string | null
          recipient_email: string | null
          share_id: string
          share_type: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          proposal_id?: string | null
          recipient_email?: string | null
          share_id: string
          share_type?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          proposal_id?: string | null
          recipient_email?: string | null
          share_id?: string
          share_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_shares_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          accepted_at: string | null
          agency_id: string | null
          bundle_savings: number | null
          client_challenge: string | null
          client_context_note: string | null
          client_goal: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          custom_colors: Json | null
          custom_milestones: Json | null
          declined_at: string | null
          estimated_duration: string | null
          executive_summary: string | null
          executive_summary_tone: string | null
          goals: Json | null
          grand_total: number | null
          id: string
          notice_period: string | null
          payment_template_id: string | null
          phases: Json | null
          project_start_date: string | null
          reference_number: string
          revision_rounds: number | null
          selected_differentiator_ids: string[] | null
          selected_testimonial_ids: string[] | null
          sent_at: string | null
          show_client_responsibilities: boolean | null
          show_out_of_scope: boolean | null
          status: string | null
          subtitle: string | null
          team: Json | null
          template_id: string | null
          title: string | null
          total_estimated: number | null
          total_fixed: number | null
          total_monthly: number | null
          updated_at: string
          valid_until: string | null
          validity_days: number | null
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          agency_id?: string | null
          bundle_savings?: number | null
          client_challenge?: string | null
          client_context_note?: string | null
          client_goal?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          custom_colors?: Json | null
          custom_milestones?: Json | null
          declined_at?: string | null
          estimated_duration?: string | null
          executive_summary?: string | null
          executive_summary_tone?: string | null
          goals?: Json | null
          grand_total?: number | null
          id?: string
          notice_period?: string | null
          payment_template_id?: string | null
          phases?: Json | null
          project_start_date?: string | null
          reference_number: string
          revision_rounds?: number | null
          selected_differentiator_ids?: string[] | null
          selected_testimonial_ids?: string[] | null
          sent_at?: string | null
          show_client_responsibilities?: boolean | null
          show_out_of_scope?: boolean | null
          status?: string | null
          subtitle?: string | null
          team?: Json | null
          template_id?: string | null
          title?: string | null
          total_estimated?: number | null
          total_fixed?: number | null
          total_monthly?: number | null
          updated_at?: string
          valid_until?: string | null
          validity_days?: number | null
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          agency_id?: string | null
          bundle_savings?: number | null
          client_challenge?: string | null
          client_context_note?: string | null
          client_goal?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          custom_colors?: Json | null
          custom_milestones?: Json | null
          declined_at?: string | null
          estimated_duration?: string | null
          executive_summary?: string | null
          executive_summary_tone?: string | null
          goals?: Json | null
          grand_total?: number | null
          id?: string
          notice_period?: string | null
          payment_template_id?: string | null
          phases?: Json | null
          project_start_date?: string | null
          reference_number?: string
          revision_rounds?: number | null
          selected_differentiator_ids?: string[] | null
          selected_testimonial_ids?: string[] | null
          sent_at?: string | null
          show_client_responsibilities?: boolean | null
          show_out_of_scope?: boolean | null
          status?: string | null
          subtitle?: string | null
          team?: Json | null
          template_id?: string | null
          title?: string | null
          total_estimated?: number | null
          total_fixed?: number | null
          total_monthly?: number | null
          updated_at?: string
          valid_until?: string | null
          validity_days?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_payment_template_id_fkey"
            columns: ["payment_template_id"]
            isOneToOne: false
            referencedRelation: "payment_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      service_groups: {
        Row: {
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
        }
        Insert: {
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
        }
        Update: {
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
        }
        Relationships: []
      }
      service_modules: {
        Row: {
          agency_id: string | null
          ai_context: string | null
          client_responsibilities: string[] | null
          common_tools: string[] | null
          created_at: string
          default_timeline: string | null
          deliverables: string[] | null
          description: string | null
          display_order: number | null
          estimated_hours: number | null
          group_id: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          out_of_scope: string[] | null
          price_fixed: number | null
          price_hourly: number | null
          price_monthly: number | null
          pricing_model: string | null
          service_type: string | null
          short_description: string | null
          suggested_kpis: string[] | null
        }
        Insert: {
          agency_id?: string | null
          ai_context?: string | null
          client_responsibilities?: string[] | null
          common_tools?: string[] | null
          created_at?: string
          default_timeline?: string | null
          deliverables?: string[] | null
          description?: string | null
          display_order?: number | null
          estimated_hours?: number | null
          group_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          out_of_scope?: string[] | null
          price_fixed?: number | null
          price_hourly?: number | null
          price_monthly?: number | null
          pricing_model?: string | null
          service_type?: string | null
          short_description?: string | null
          suggested_kpis?: string[] | null
        }
        Update: {
          agency_id?: string | null
          ai_context?: string | null
          client_responsibilities?: string[] | null
          common_tools?: string[] | null
          created_at?: string
          default_timeline?: string | null
          deliverables?: string[] | null
          description?: string | null
          display_order?: number | null
          estimated_hours?: number | null
          group_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          out_of_scope?: string[] | null
          price_fixed?: number | null
          price_hourly?: number | null
          price_monthly?: number | null
          pricing_model?: string | null
          service_type?: string | null
          short_description?: string | null
          suggested_kpis?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "service_modules_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_modules_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "service_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      terms_clauses: {
        Row: {
          agency_id: string | null
          content: string
          display_order: number | null
          id: string
          is_default: boolean | null
          title: string
        }
        Insert: {
          agency_id?: string | null
          content: string
          display_order?: number | null
          id?: string
          is_default?: boolean | null
          title: string
        }
        Update: {
          agency_id?: string | null
          content?: string
          display_order?: number | null
          id?: string
          is_default?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_clauses_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          agency_id: string | null
          avatar_url: string | null
          client_company: string | null
          client_name: string
          client_title: string | null
          created_at: string
          id: string
          is_featured: boolean | null
          metric_label: string | null
          metric_value: string | null
          quote: string
          relevant_services: string[] | null
          source: string | null
        }
        Insert: {
          agency_id?: string | null
          avatar_url?: string | null
          client_company?: string | null
          client_name: string
          client_title?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean | null
          metric_label?: string | null
          metric_value?: string | null
          quote: string
          relevant_services?: string[] | null
          source?: string | null
        }
        Update: {
          agency_id?: string | null
          avatar_url?: string | null
          client_company?: string | null
          client_name?: string
          client_title?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean | null
          metric_label?: string | null
          metric_value?: string | null
          quote?: string
          relevant_services?: string[] | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_phases: {
        Row: {
          agency_id: string | null
          default_duration: string | null
          description: string | null
          display_order: number | null
          id: string
          name: string
        }
        Insert: {
          agency_id?: string | null
          default_duration?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
        }
        Update: {
          agency_id?: string | null
          default_duration?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_phases_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          agency_id: string | null
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string | null
        }
        Insert: {
          agency_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string | null
        }
        Update: {
          agency_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_shared_proposal_ids: { Args: never; Returns: string[] }
      get_user_agency_id: { Args: { p_user_id: string }; Returns: string }
      has_active_share: { Args: { p_proposal_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
