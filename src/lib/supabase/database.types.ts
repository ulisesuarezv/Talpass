export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      activity_pings: {
        Row: {
          candidate_id: string;
          confirmed_at: string | null;
          created_at: string;
          expires_at: string;
          id: string;
          sent_at: string;
          token: string;
        };
        Insert: {
          candidate_id: string;
          confirmed_at?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          sent_at?: string;
          token: string;
        };
        Update: {
          candidate_id?: string;
          confirmed_at?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          sent_at?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'activity_pings_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_directory';
            referencedColumns: ['candidate_id'];
          },
          {
            foreignKeyName: 'activity_pings_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['profile_id'];
          },
        ];
      };
      agencies: {
        Row: {
          country_code: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          registration_number: string | null;
          registration_type_id: string | null;
          slug: string;
          status: Database['public']['Enums']['agency_status'];
          updated_at: string;
        };
        Insert: {
          country_code: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          registration_number?: string | null;
          registration_type_id?: string | null;
          slug: string;
          status?: Database['public']['Enums']['agency_status'];
          updated_at?: string;
        };
        Update: {
          country_code?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          registration_number?: string | null;
          registration_type_id?: string | null;
          slug?: string;
          status?: Database['public']['Enums']['agency_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'agencies_country_code_fkey';
            columns: ['country_code'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'agencies_registration_type_id_fkey';
            columns: ['registration_type_id'];
            isOneToOne: false;
            referencedRelation: 'registration_types';
            referencedColumns: ['id'];
          },
        ];
      };
      agency_members: {
        Row: {
          agency_id: string;
          created_at: string;
          id: string;
          profile_id: string;
          role: Database['public']['Enums']['agency_member_role'];
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          created_at?: string;
          id?: string;
          profile_id: string;
          role?: Database['public']['Enums']['agency_member_role'];
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          created_at?: string;
          id?: string;
          profile_id?: string;
          role?: Database['public']['Enums']['agency_member_role'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'agency_members_agency_id_fkey';
            columns: ['agency_id'];
            isOneToOne: false;
            referencedRelation: 'agencies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'agency_members_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      agency_sectors: {
        Row: {
          agency_id: string;
          sector_id: string;
        };
        Insert: {
          agency_id: string;
          sector_id: string;
        };
        Update: {
          agency_id?: string;
          sector_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'agency_sectors_agency_id_fkey';
            columns: ['agency_id'];
            isOneToOne: false;
            referencedRelation: 'agencies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'agency_sectors_sector_id_fkey';
            columns: ['sector_id'];
            isOneToOne: false;
            referencedRelation: 'sectors';
            referencedColumns: ['id'];
          },
        ];
      };
      agency_translations: {
        Row: {
          agency_id: string;
          description: string | null;
          locale: string;
        };
        Insert: {
          agency_id: string;
          description?: string | null;
          locale: string;
        };
        Update: {
          agency_id?: string;
          description?: string | null;
          locale?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'agency_translations_agency_id_fkey';
            columns: ['agency_id'];
            isOneToOne: false;
            referencedRelation: 'agencies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'agency_translations_locale_fkey';
            columns: ['locale'];
            isOneToOne: false;
            referencedRelation: 'locales';
            referencedColumns: ['code'];
          },
        ];
      };
      application_events: {
        Row: {
          actor_profile_id: string | null;
          application_id: string;
          created_at: string;
          from_status: Database['public']['Enums']['application_status'] | null;
          id: string;
          note: string | null;
          to_status: Database['public']['Enums']['application_status'];
        };
        Insert: {
          actor_profile_id?: string | null;
          application_id: string;
          created_at?: string;
          from_status?:
            Database['public']['Enums']['application_status'] | null;
          id?: string;
          note?: string | null;
          to_status: Database['public']['Enums']['application_status'];
        };
        Update: {
          actor_profile_id?: string | null;
          application_id?: string;
          created_at?: string;
          from_status?:
            Database['public']['Enums']['application_status'] | null;
          id?: string;
          note?: string | null;
          to_status?: Database['public']['Enums']['application_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'application_events_actor_profile_id_fkey';
            columns: ['actor_profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'application_events_application_id_fkey';
            columns: ['application_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['id'];
          },
        ];
      };
      applications: {
        Row: {
          candidate_id: string;
          created_at: string;
          id: string;
          job_id: string;
          rejection_reason: string | null;
          status: Database['public']['Enums']['application_status'];
          status_changed_at: string;
          updated_at: string;
        };
        Insert: {
          candidate_id: string;
          created_at?: string;
          id?: string;
          job_id: string;
          rejection_reason?: string | null;
          status?: Database['public']['Enums']['application_status'];
          status_changed_at?: string;
          updated_at?: string;
        };
        Update: {
          candidate_id?: string;
          created_at?: string;
          id?: string;
          job_id?: string;
          rejection_reason?: string | null;
          status?: Database['public']['Enums']['application_status'];
          status_changed_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'applications_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_directory';
            referencedColumns: ['candidate_id'];
          },
          {
            foreignKeyName: 'applications_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'applications_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
        ];
      };
      candidate_contact_requests: {
        Row: {
          agency_id: string;
          candidate_id: string;
          created_at: string;
          id: string;
          message: string;
          requested_by: string | null;
          responded_at: string | null;
          status: Database['public']['Enums']['contact_request_status'];
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          candidate_id: string;
          created_at?: string;
          id?: string;
          message: string;
          requested_by?: string | null;
          responded_at?: string | null;
          status?: Database['public']['Enums']['contact_request_status'];
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          candidate_id?: string;
          created_at?: string;
          id?: string;
          message?: string;
          requested_by?: string | null;
          responded_at?: string | null;
          status?: Database['public']['Enums']['contact_request_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'candidate_contact_requests_agency_id_fkey';
            columns: ['agency_id'];
            isOneToOne: false;
            referencedRelation: 'agencies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'candidate_contact_requests_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_directory';
            referencedColumns: ['candidate_id'];
          },
          {
            foreignKeyName: 'candidate_contact_requests_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'candidate_contact_requests_requested_by_fkey';
            columns: ['requested_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      candidate_documents: {
        Row: {
          candidate_id: string;
          created_at: string;
          document_type_id: string;
          id: string;
          mime_type: string;
          rejection_reason: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          size_bytes: number;
          status: Database['public']['Enums']['document_status'];
          storage_bucket: string;
          storage_path: string;
          updated_at: string;
        };
        Insert: {
          candidate_id: string;
          created_at?: string;
          document_type_id: string;
          id?: string;
          mime_type: string;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          size_bytes: number;
          status?: Database['public']['Enums']['document_status'];
          storage_bucket?: string;
          storage_path: string;
          updated_at?: string;
        };
        Update: {
          candidate_id?: string;
          created_at?: string;
          document_type_id?: string;
          id?: string;
          mime_type?: string;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          size_bytes?: number;
          status?: Database['public']['Enums']['document_status'];
          storage_bucket?: string;
          storage_path?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'candidate_documents_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_directory';
            referencedColumns: ['candidate_id'];
          },
          {
            foreignKeyName: 'candidate_documents_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'candidate_documents_document_type_id_fkey';
            columns: ['document_type_id'];
            isOneToOne: false;
            referencedRelation: 'document_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'candidate_documents_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      candidate_identifiers: {
        Row: {
          candidate_id: string;
          created_at: string;
          id: string;
          identifier_type_id: string;
          updated_at: string;
          value_blind_index: string;
          value_ciphertext: string;
          value_key_id: string;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          candidate_id: string;
          created_at?: string;
          id?: string;
          identifier_type_id: string;
          updated_at?: string;
          value_blind_index: string;
          value_ciphertext: string;
          value_key_id: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          candidate_id?: string;
          created_at?: string;
          id?: string;
          identifier_type_id?: string;
          updated_at?: string;
          value_blind_index?: string;
          value_ciphertext?: string;
          value_key_id?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'candidate_identifiers_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_directory';
            referencedColumns: ['candidate_id'];
          },
          {
            foreignKeyName: 'candidate_identifiers_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'candidate_identifiers_identifier_type_id_fkey';
            columns: ['identifier_type_id'];
            isOneToOne: false;
            referencedRelation: 'identifier_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'candidate_identifiers_verified_by_fkey';
            columns: ['verified_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      candidate_onboarding_drafts: {
        Row: {
          created_at: string;
          data: Json;
          profile_id: string;
          step: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          data?: Json;
          profile_id: string;
          step?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          data?: Json;
          profile_id?: string;
          step?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'candidate_onboarding_drafts_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      candidate_private: {
        Row: {
          address_line: string | null;
          candidate_id: string;
          city: string | null;
          country_code: string | null;
          created_at: string;
          iban_ciphertext: string | null;
          iban_key_id: string | null;
          iban_last4: string | null;
          phone: string | null;
          postal_code: string | null;
          updated_at: string;
        };
        Insert: {
          address_line?: string | null;
          candidate_id: string;
          city?: string | null;
          country_code?: string | null;
          created_at?: string;
          iban_ciphertext?: string | null;
          iban_key_id?: string | null;
          iban_last4?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          updated_at?: string;
        };
        Update: {
          address_line?: string | null;
          candidate_id?: string;
          city?: string | null;
          country_code?: string | null;
          created_at?: string;
          iban_ciphertext?: string | null;
          iban_key_id?: string | null;
          iban_last4?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'candidate_private_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: true;
            referencedRelation: 'candidate_directory';
            referencedColumns: ['candidate_id'];
          },
          {
            foreignKeyName: 'candidate_private_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: true;
            referencedRelation: 'candidates';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'candidate_private_country_code_fkey';
            columns: ['country_code'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['code'];
          },
        ];
      };
      candidate_sectors: {
        Row: {
          candidate_id: string;
          created_at: string;
          months_experience: number;
          sector_id: string;
        };
        Insert: {
          candidate_id: string;
          created_at?: string;
          months_experience?: number;
          sector_id: string;
        };
        Update: {
          candidate_id?: string;
          created_at?: string;
          months_experience?: number;
          sector_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'candidate_sectors_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_directory';
            referencedColumns: ['candidate_id'];
          },
          {
            foreignKeyName: 'candidate_sectors_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'candidate_sectors_sector_id_fkey';
            columns: ['sector_id'];
            isOneToOne: false;
            referencedRelation: 'sectors';
            referencedColumns: ['id'];
          },
        ];
      };
      candidates: {
        Row: {
          created_at: string;
          current_city: string | null;
          current_country_code: string;
          date_of_birth: string;
          deleted_at: string | null;
          english_level: Database['public']['Enums']['language_level'] | null;
          first_name: string;
          has_driving_license: boolean;
          last_activity_at: string;
          last_name: string;
          nationality_code: string;
          needs_housing: boolean;
          needs_transport: boolean;
          profile_id: string;
          status: Database['public']['Enums']['candidate_status'];
          updated_at: string;
          verification_status: Database['public']['Enums']['verification_status'];
          work_experience: string | null;
          worked_in_nl_de: boolean;
        };
        Insert: {
          created_at?: string;
          current_city?: string | null;
          current_country_code: string;
          date_of_birth: string;
          deleted_at?: string | null;
          english_level?: Database['public']['Enums']['language_level'] | null;
          first_name: string;
          has_driving_license?: boolean;
          last_activity_at?: string;
          last_name: string;
          nationality_code: string;
          needs_housing?: boolean;
          needs_transport?: boolean;
          profile_id: string;
          status?: Database['public']['Enums']['candidate_status'];
          updated_at?: string;
          verification_status?: Database['public']['Enums']['verification_status'];
          work_experience?: string | null;
          worked_in_nl_de?: boolean;
        };
        Update: {
          created_at?: string;
          current_city?: string | null;
          current_country_code?: string;
          date_of_birth?: string;
          deleted_at?: string | null;
          english_level?: Database['public']['Enums']['language_level'] | null;
          first_name?: string;
          has_driving_license?: boolean;
          last_activity_at?: string;
          last_name?: string;
          nationality_code?: string;
          needs_housing?: boolean;
          needs_transport?: boolean;
          profile_id?: string;
          status?: Database['public']['Enums']['candidate_status'];
          updated_at?: string;
          verification_status?: Database['public']['Enums']['verification_status'];
          work_experience?: string | null;
          worked_in_nl_de?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'candidates_current_country_code_fkey';
            columns: ['current_country_code'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'candidates_nationality_code_fkey';
            columns: ['nationality_code'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'candidates_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      consents: {
        Row: {
          created_at: string;
          granted_at: string;
          id: string;
          ip: unknown;
          profile_id: string;
          revoked_at: string | null;
          type: Database['public']['Enums']['consent_type'];
          user_agent: string | null;
          version: string;
        };
        Insert: {
          created_at?: string;
          granted_at?: string;
          id?: string;
          ip?: unknown;
          profile_id: string;
          revoked_at?: string | null;
          type: Database['public']['Enums']['consent_type'];
          user_agent?: string | null;
          version: string;
        };
        Update: {
          created_at?: string;
          granted_at?: string;
          id?: string;
          ip?: unknown;
          profile_id?: string;
          revoked_at?: string | null;
          type?: Database['public']['Enums']['consent_type'];
          user_agent?: string | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'consents_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      countries: {
        Row: {
          code: string;
          created_at: string;
          default_currency: string;
          is_active: boolean;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          default_currency: string;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          default_currency?: string;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      country_document_requirements: {
        Row: {
          country_code: string;
          created_at: string;
          document_type_id: string;
          is_required: boolean;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          country_code: string;
          created_at?: string;
          document_type_id: string;
          is_required?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          country_code?: string;
          created_at?: string;
          document_type_id?: string;
          is_required?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'country_document_requirements_country_code_fkey';
            columns: ['country_code'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'country_document_requirements_document_type_id_fkey';
            columns: ['document_type_id'];
            isOneToOne: false;
            referencedRelation: 'document_types';
            referencedColumns: ['id'];
          },
        ];
      };
      country_translations: {
        Row: {
          country_code: string;
          locale: string;
          name: string;
        };
        Insert: {
          country_code: string;
          locale: string;
          name: string;
        };
        Update: {
          country_code?: string;
          locale?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'country_translations_country_code_fkey';
            columns: ['country_code'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'country_translations_locale_fkey';
            columns: ['locale'];
            isOneToOne: false;
            referencedRelation: 'locales';
            referencedColumns: ['code'];
          },
        ];
      };
      data_deletion_requests: {
        Row: {
          created_at: string;
          id: string;
          processed_at: string | null;
          processed_by: string | null;
          profile_id: string;
          reason: string | null;
          requested_at: string;
          status: Database['public']['Enums']['deletion_request_status'];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          processed_at?: string | null;
          processed_by?: string | null;
          profile_id: string;
          reason?: string | null;
          requested_at?: string;
          status?: Database['public']['Enums']['deletion_request_status'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          processed_at?: string | null;
          processed_by?: string | null;
          profile_id?: string;
          reason?: string | null;
          requested_at?: string;
          status?: Database['public']['Enums']['deletion_request_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'data_deletion_requests_processed_by_fkey';
            columns: ['processed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'data_deletion_requests_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      document_access_log: {
        Row: {
          document_id: string | null;
          id: string;
          ip: unknown;
          opened_at: string;
          opened_by: string | null;
          request_id: string | null;
          user_agent: string | null;
        };
        Insert: {
          document_id?: string | null;
          id?: string;
          ip?: unknown;
          opened_at?: string;
          opened_by?: string | null;
          request_id?: string | null;
          user_agent?: string | null;
        };
        Update: {
          document_id?: string | null;
          id?: string;
          ip?: unknown;
          opened_at?: string;
          opened_by?: string | null;
          request_id?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'document_access_log_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_documents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'document_access_log_opened_by_fkey';
            columns: ['opened_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'document_access_log_request_id_fkey';
            columns: ['request_id'];
            isOneToOne: false;
            referencedRelation: 'document_access_requests';
            referencedColumns: ['id'];
          },
        ];
      };
      document_access_request_scope: {
        Row: {
          document_type_id: string;
          request_id: string;
        };
        Insert: {
          document_type_id: string;
          request_id: string;
        };
        Update: {
          document_type_id?: string;
          request_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'document_access_request_scope_document_type_id_fkey';
            columns: ['document_type_id'];
            isOneToOne: false;
            referencedRelation: 'document_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'document_access_request_scope_request_id_fkey';
            columns: ['request_id'];
            isOneToOne: false;
            referencedRelation: 'document_access_requests';
            referencedColumns: ['id'];
          },
        ];
      };
      document_access_requests: {
        Row: {
          access_expires_at: string | null;
          agency_id: string;
          application_id: string | null;
          candidate_id: string;
          created_at: string;
          expires_at: string;
          id: string;
          message: string | null;
          reminder_sent_at: string | null;
          requested_at: string;
          requested_by: string | null;
          responded_at: string | null;
          revoked_at: string | null;
          status: Database['public']['Enums']['access_request_status'];
          updated_at: string;
        };
        Insert: {
          access_expires_at?: string | null;
          agency_id: string;
          application_id?: string | null;
          candidate_id: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          message?: string | null;
          reminder_sent_at?: string | null;
          requested_at?: string;
          requested_by?: string | null;
          responded_at?: string | null;
          revoked_at?: string | null;
          status?: Database['public']['Enums']['access_request_status'];
          updated_at?: string;
        };
        Update: {
          access_expires_at?: string | null;
          agency_id?: string;
          application_id?: string | null;
          candidate_id?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          message?: string | null;
          reminder_sent_at?: string | null;
          requested_at?: string;
          requested_by?: string | null;
          responded_at?: string | null;
          revoked_at?: string | null;
          status?: Database['public']['Enums']['access_request_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'document_access_requests_agency_id_fkey';
            columns: ['agency_id'];
            isOneToOne: false;
            referencedRelation: 'agencies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'document_access_requests_application_id_fkey';
            columns: ['application_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'document_access_requests_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidate_directory';
            referencedColumns: ['candidate_id'];
          },
          {
            foreignKeyName: 'document_access_requests_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['profile_id'];
          },
          {
            foreignKeyName: 'document_access_requests_requested_by_fkey';
            columns: ['requested_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      document_type_translations: {
        Row: {
          document_type_id: string;
          help_text: string | null;
          locale: string;
          name: string;
        };
        Insert: {
          document_type_id: string;
          help_text?: string | null;
          locale: string;
          name: string;
        };
        Update: {
          document_type_id?: string;
          help_text?: string | null;
          locale?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'document_type_translations_document_type_id_fkey';
            columns: ['document_type_id'];
            isOneToOne: false;
            referencedRelation: 'document_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'document_type_translations_locale_fkey';
            columns: ['locale'];
            isOneToOne: false;
            referencedRelation: 'locales';
            referencedColumns: ['code'];
          },
        ];
      };
      document_types: {
        Row: {
          accepted_mime_types: string[];
          created_at: string;
          id: string;
          is_active: boolean;
          max_size_bytes: number;
          slug: string;
          sort_order: number;
          storage_bucket: string;
          updated_at: string;
        };
        Insert: {
          accepted_mime_types: string[];
          created_at?: string;
          id?: string;
          is_active?: boolean;
          max_size_bytes?: number;
          slug: string;
          sort_order?: number;
          storage_bucket?: string;
          updated_at?: string;
        };
        Update: {
          accepted_mime_types?: string[];
          created_at?: string;
          id?: string;
          is_active?: boolean;
          max_size_bytes?: number;
          slug?: string;
          sort_order?: number;
          storage_bucket?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_log: {
        Row: {
          created_at: string;
          error: string | null;
          id: string;
          locale: string | null;
          profile_id: string | null;
          provider_id: string | null;
          recipient_email: string | null;
          sent_at: string | null;
          status: Database['public']['Enums']['email_status'];
          template: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          error?: string | null;
          id?: string;
          locale?: string | null;
          profile_id?: string | null;
          provider_id?: string | null;
          recipient_email?: string | null;
          sent_at?: string | null;
          status?: Database['public']['Enums']['email_status'];
          template: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          error?: string | null;
          id?: string;
          locale?: string | null;
          profile_id?: string | null;
          provider_id?: string | null;
          recipient_email?: string | null;
          sent_at?: string | null;
          status?: Database['public']['Enums']['email_status'];
          template?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'email_log_locale_fkey';
            columns: ['locale'];
            isOneToOne: false;
            referencedRelation: 'locales';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'email_log_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      identifier_type_translations: {
        Row: {
          help_text: string | null;
          identifier_type_id: string;
          locale: string;
          name: string;
        };
        Insert: {
          help_text?: string | null;
          identifier_type_id: string;
          locale: string;
          name: string;
        };
        Update: {
          help_text?: string | null;
          identifier_type_id?: string;
          locale?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'identifier_type_translations_identifier_type_id_fkey';
            columns: ['identifier_type_id'];
            isOneToOne: false;
            referencedRelation: 'identifier_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'identifier_type_translations_locale_fkey';
            columns: ['locale'];
            isOneToOne: false;
            referencedRelation: 'locales';
            referencedColumns: ['code'];
          },
        ];
      };
      identifier_types: {
        Row: {
          country_code: string;
          created_at: string;
          id: string;
          is_active: boolean;
          slug: string;
          sort_order: number;
          updated_at: string;
          validation_regex: string;
        };
        Insert: {
          country_code: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          slug: string;
          sort_order?: number;
          updated_at?: string;
          validation_regex: string;
        };
        Update: {
          country_code?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
          validation_regex?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'identifier_types_country_code_fkey';
            columns: ['country_code'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['code'];
          },
        ];
      };
      job_translations: {
        Row: {
          benefits: string | null;
          created_at: string;
          description: string;
          job_id: string;
          locale: string;
          requirements: string | null;
          tasks: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          benefits?: string | null;
          created_at?: string;
          description: string;
          job_id: string;
          locale: string;
          requirements?: string | null;
          tasks?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          benefits?: string | null;
          created_at?: string;
          description?: string;
          job_id?: string;
          locale?: string;
          requirements?: string | null;
          tasks?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'job_translations_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_translations_locale_fkey';
            columns: ['locale'];
            isOneToOne: false;
            referencedRelation: 'locales';
            referencedColumns: ['code'];
          },
        ];
      };
      jobs: {
        Row: {
          agency_id: string;
          city: string | null;
          client_company_name: string | null;
          country_code: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          expires_at: string | null;
          housing_currency: string | null;
          housing_price: number | null;
          housing_provided: boolean;
          id: string;
          min_contract_months: number | null;
          published_at: string | null;
          required_language_code: string | null;
          required_language_level:
            Database['public']['Enums']['language_level'] | null;
          requires_driving_license: boolean;
          salary_currency: string | null;
          salary_max: number | null;
          salary_min: number | null;
          salary_period: Database['public']['Enums']['salary_period'] | null;
          sector_id: string;
          shifts: Database['public']['Enums']['shift_type'][];
          show_client_company: boolean;
          slug: string;
          start_date: string | null;
          status: Database['public']['Enums']['job_status'];
          transport_provided: boolean;
          updated_at: string;
          weekly_hours: number | null;
        };
        Insert: {
          agency_id: string;
          city?: string | null;
          client_company_name?: string | null;
          country_code: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          expires_at?: string | null;
          housing_currency?: string | null;
          housing_price?: number | null;
          housing_provided?: boolean;
          id?: string;
          min_contract_months?: number | null;
          published_at?: string | null;
          required_language_code?: string | null;
          required_language_level?:
            Database['public']['Enums']['language_level'] | null;
          requires_driving_license?: boolean;
          salary_currency?: string | null;
          salary_max?: number | null;
          salary_min?: number | null;
          salary_period?: Database['public']['Enums']['salary_period'] | null;
          sector_id: string;
          shifts?: Database['public']['Enums']['shift_type'][];
          show_client_company?: boolean;
          slug: string;
          start_date?: string | null;
          status?: Database['public']['Enums']['job_status'];
          transport_provided?: boolean;
          updated_at?: string;
          weekly_hours?: number | null;
        };
        Update: {
          agency_id?: string;
          city?: string | null;
          client_company_name?: string | null;
          country_code?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          expires_at?: string | null;
          housing_currency?: string | null;
          housing_price?: number | null;
          housing_provided?: boolean;
          id?: string;
          min_contract_months?: number | null;
          published_at?: string | null;
          required_language_code?: string | null;
          required_language_level?:
            Database['public']['Enums']['language_level'] | null;
          requires_driving_license?: boolean;
          salary_currency?: string | null;
          salary_max?: number | null;
          salary_min?: number | null;
          salary_period?: Database['public']['Enums']['salary_period'] | null;
          sector_id?: string;
          shifts?: Database['public']['Enums']['shift_type'][];
          show_client_company?: boolean;
          slug?: string;
          start_date?: string | null;
          status?: Database['public']['Enums']['job_status'];
          transport_provided?: boolean;
          updated_at?: string;
          weekly_hours?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'jobs_agency_id_fkey';
            columns: ['agency_id'];
            isOneToOne: false;
            referencedRelation: 'agencies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_country_code_fkey';
            columns: ['country_code'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'jobs_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_required_language_code_fkey';
            columns: ['required_language_code'];
            isOneToOne: false;
            referencedRelation: 'languages';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'jobs_sector_id_fkey';
            columns: ['sector_id'];
            isOneToOne: false;
            referencedRelation: 'sectors';
            referencedColumns: ['id'];
          },
        ];
      };
      language_translations: {
        Row: {
          language_code: string;
          locale: string;
          name: string;
        };
        Insert: {
          language_code: string;
          locale: string;
          name: string;
        };
        Update: {
          language_code?: string;
          locale?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'language_translations_language_code_fkey';
            columns: ['language_code'];
            isOneToOne: false;
            referencedRelation: 'languages';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'language_translations_locale_fkey';
            columns: ['locale'];
            isOneToOne: false;
            referencedRelation: 'locales';
            referencedColumns: ['code'];
          },
        ];
      };
      languages: {
        Row: {
          code: string;
          created_at: string;
          is_active: boolean;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      locales: {
        Row: {
          code: string;
          created_at: string;
          is_active: boolean;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          last_seen_at: string | null;
          locale: string;
          role: Database['public']['Enums']['user_role'];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
          last_seen_at?: string | null;
          locale?: string;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          last_seen_at?: string | null;
          locale?: string;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_locale_fkey';
            columns: ['locale'];
            isOneToOne: false;
            referencedRelation: 'locales';
            referencedColumns: ['code'];
          },
        ];
      };
      registration_type_translations: {
        Row: {
          locale: string;
          name: string;
          registration_type_id: string;
        };
        Insert: {
          locale: string;
          name: string;
          registration_type_id: string;
        };
        Update: {
          locale?: string;
          name?: string;
          registration_type_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'registration_type_translations_locale_fkey';
            columns: ['locale'];
            isOneToOne: false;
            referencedRelation: 'locales';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'registration_type_translations_registration_type_id_fkey';
            columns: ['registration_type_id'];
            isOneToOne: false;
            referencedRelation: 'registration_types';
            referencedColumns: ['id'];
          },
        ];
      };
      registration_types: {
        Row: {
          country_code: string;
          created_at: string;
          id: string;
          is_active: boolean;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          country_code: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          country_code?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'registration_types_country_code_fkey';
            columns: ['country_code'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['code'];
          },
        ];
      };
      sector_translations: {
        Row: {
          locale: string;
          name: string;
          sector_id: string;
        };
        Insert: {
          locale: string;
          name: string;
          sector_id: string;
        };
        Update: {
          locale?: string;
          name?: string;
          sector_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sector_translations_locale_fkey';
            columns: ['locale'];
            isOneToOne: false;
            referencedRelation: 'locales';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'sector_translations_sector_id_fkey';
            columns: ['sector_id'];
            isOneToOne: false;
            referencedRelation: 'sectors';
            referencedColumns: ['id'];
          },
        ];
      };
      sectors: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      candidate_directory: {
        Row: {
          age: number | null;
          candidate_id: string | null;
          created_at: string | null;
          current_city: string | null;
          current_country_code: string | null;
          display_name: string | null;
          driving_license_verified: boolean | null;
          english_level: Database['public']['Enums']['language_level'] | null;
          has_audio: boolean | null;
          has_cv: boolean | null;
          has_driving_license: boolean | null;
          iban_on_file: boolean | null;
          identity_verified: boolean | null;
          last_activity_at: string | null;
          nationality_code: string | null;
          needs_housing: boolean | null;
          needs_transport: boolean | null;
          sectors: Json | null;
          tax_id_verified: boolean | null;
          work_experience: string | null;
          worked_in_nl_de: boolean | null;
        };
        Insert: {
          age?: never;
          candidate_id?: string | null;
          created_at?: string | null;
          current_city?: string | null;
          current_country_code?: string | null;
          display_name?: never;
          driving_license_verified?: never;
          english_level?: Database['public']['Enums']['language_level'] | null;
          has_audio?: never;
          has_cv?: never;
          has_driving_license?: boolean | null;
          iban_on_file?: never;
          identity_verified?: never;
          last_activity_at?: string | null;
          nationality_code?: string | null;
          needs_housing?: boolean | null;
          needs_transport?: boolean | null;
          sectors?: never;
          tax_id_verified?: never;
          work_experience?: string | null;
          worked_in_nl_de?: boolean | null;
        };
        Update: {
          age?: never;
          candidate_id?: string | null;
          created_at?: string | null;
          current_city?: string | null;
          current_country_code?: string | null;
          display_name?: never;
          driving_license_verified?: never;
          english_level?: Database['public']['Enums']['language_level'] | null;
          has_audio?: never;
          has_cv?: never;
          has_driving_license?: boolean | null;
          iban_on_file?: never;
          identity_verified?: never;
          last_activity_at?: string | null;
          nationality_code?: string | null;
          needs_housing?: boolean | null;
          needs_transport?: boolean | null;
          sectors?: never;
          tax_id_verified?: never;
          work_experience?: string | null;
          worked_in_nl_de?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'candidates_current_country_code_fkey';
            columns: ['current_country_code'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'candidates_nationality_code_fkey';
            columns: ['nationality_code'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'candidates_profile_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      rls_audit: {
        Args: never;
        Returns: {
          policy_count: number;
          rls_enabled: boolean;
          table_name: string;
        }[];
      };
      touch_last_activity: { Args: never; Returns: undefined };
    };
    Enums: {
      access_request_status:
        'pending' | 'granted' | 'denied' | 'expired' | 'revoked';
      agency_member_role: 'owner' | 'recruiter';
      agency_status: 'pending' | 'approved' | 'suspended';
      application_status:
        'pending' | 'in_review' | 'documents_requested' | 'hired' | 'rejected';
      candidate_status: 'active' | 'inactive';
      consent_type: 'terms' | 'privacy' | 'data_sharing' | 'audio_sharing';
      contact_request_status: 'pending' | 'accepted' | 'declined' | 'expired';
      deletion_request_status:
        'pending' | 'processing' | 'completed' | 'rejected';
      document_status: 'pending' | 'verified' | 'rejected';
      email_status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';
      job_status: 'draft' | 'published' | 'paused' | 'closed';
      language_level: 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2' | 'native';
      salary_period: 'hour' | 'month';
      shift_type: 'morning' | 'afternoon' | 'night' | 'rotating';
      user_role: 'candidate' | 'agency_member' | 'admin';
      verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      access_request_status: [
        'pending',
        'granted',
        'denied',
        'expired',
        'revoked',
      ],
      agency_member_role: ['owner', 'recruiter'],
      agency_status: ['pending', 'approved', 'suspended'],
      application_status: [
        'pending',
        'in_review',
        'documents_requested',
        'hired',
        'rejected',
      ],
      candidate_status: ['active', 'inactive'],
      consent_type: ['terms', 'privacy', 'data_sharing', 'audio_sharing'],
      contact_request_status: ['pending', 'accepted', 'declined', 'expired'],
      deletion_request_status: [
        'pending',
        'processing',
        'completed',
        'rejected',
      ],
      document_status: ['pending', 'verified', 'rejected'],
      email_status: ['queued', 'sent', 'delivered', 'bounced', 'failed'],
      job_status: ['draft', 'published', 'paused', 'closed'],
      language_level: ['a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'native'],
      salary_period: ['hour', 'month'],
      shift_type: ['morning', 'afternoon', 'night', 'rotating'],
      user_role: ['candidate', 'agency_member', 'admin'],
      verification_status: ['unverified', 'pending', 'verified', 'rejected'],
    },
  },
} as const;
