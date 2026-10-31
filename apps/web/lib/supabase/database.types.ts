export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type GuildChatMessageRow = {
  id: string; sequence: number; guild_id: string; author_traveler_id: string | null;
  client_id: string; author_name: string; author_body_type: 'male' | 'female';
  author_skin_tone: 'claro' | 'medio' | 'escuro'; author_hair_style: 'curto' | 'longo' | 'cacheado';
  author_outfit: 'musgo' | 'ocre' | 'azul'; body: string | null;
  is_announcement: boolean; created_at: string; removed_at: string | null;
};
export type GuildChatSummary = {
  unread_count: number; last_read_sequence: number; can_announce: boolean; can_moderate: boolean;
};
export type GuildChatReportRow = {
  id: string; guild_id: string; message_id: string; reporter_traveler_id: string | null;
  reason: string; status: string; created_at: string;
};
export type GuildChatLogRow = {
  id: string; guild_id: string; message_id: string; actor_traveler_id: string | null;
  action: string; reason: string; created_at: string;
};

export type ProfileRow = {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};

export type TravelerRow = {
  id: string;
  user_id: string;
  name: string;
  body_type: string;
  skin_tone: string;
  hair_style: string;
  hair_color: string | null;
  avatar_variant: string | null;
  level: number;
  xp: number;
  is_active: boolean;
  journey_progress?: Json | null;
  created_at: string;
  updated_at: string;
};

export type TravelerStatsRow = {
  traveler_id: string;
  base_life: number;
  base_strength: number;
  base_defense: number;
  base_wisdom: number;
  created_at: string;
  updated_at: string;
};

export type WalletRow = {
  traveler_id: string;
  coins: number;
  created_at: string;
  updated_at: string;
};

export type InventoryRow = {
  card_receipt_id?: string | null;
  card_version?: string | null;
  card_revoked_at?: string | null;
  id: string;
  traveler_id: string;
  item_id: string;
  quantity: number;
  acquired_at: string;
  metadata: Json | null;
};

export type EquippedItemRow = {
  traveler_id: string;
  slot: string;
  item_id: string;
  equipped_at: string;
};

export type GuildRow = {
  id: string; name: string; description: string | null; created_by_user_id: string;
  leader_traveler_id: string; status: string; created_at: string; updated_at: string;
};
export type GuildMemberRow = {
  id: string; guild_id: string; traveler_id: string; role: string; status: string;
  joined_at: string; updated_at: string;
};
export type GuildInviteRow = {
  id: string; guild_id: string; invited_traveler_id: string | null; invited_by_traveler_id: string;
  status: string; expires_at: string | null; created_at: string; updated_at: string;
};
export type GuildJoinRequestRow = {
  id: string; guild_id: string; traveler_id: string; status: string;
  reviewed_by_traveler_id: string | null; reviewed_at: string | null; created_at: string; updated_at: string;
};
export type GuildMissionRow = {
  id: string; guild_id: string; created_by_traveler_id: string; title: string; description: string | null;
  mission_type: string; bible_reference: string | null; bible_url: string | null; completion_mode: string;
  requires_leader_approval: boolean; reward_tier: string; status: string; starts_at: string | null;
  due_at: string | null; metadata: Json | null; published_at: string | null; closed_at: string | null;
  created_at: string; updated_at: string;
};
export type GuildLessonRow = {
  id: string; guild_id: string; created_by_traveler_id: string; related_mission_id: string | null;
  title: string; theme: string; bible_reference: string; bible_url: string | null;
  introduction: string; content: string; main_points: Json; discussion_questions: Json;
  activity_text: string | null; status: string; scheduled_at: string | null;
  published_at: string | null; completed_at: string | null; created_at: string; updated_at: string;
};
export type GuildMissionProgressRow = {
  id: string; mission_id: string; traveler_id: string; status: string; started_at: string | null;
  submitted_at: string | null; completed_at: string | null; approved_at: string | null;
  approved_by_traveler_id: string | null; completion_note: string | null; review_note: string | null; reward_claimed_at: string | null;
  created_at: string; updated_at: string;
};
export type GuildRewardClaimRow = {
  id: string; mission_id: string; traveler_id: string; reward_tier: string;
  xp_awarded: number; coins_awarded: number; created_at: string;
};
export type GuildActivityRow = {
  id: string; guild_id: string; actor_traveler_id: string | null; event_type: string;
  entity_type: string | null; entity_id: string | null; metadata: Json; created_at: string;
};
export type GuildAdminMissionStats = {
  mission_id: string; participants: number; completed: number; pending: number; completed_recent: number;
};
export type TravelerChestRow = {
  traveler_id: string; chest_type: string; quantity: number; sources: Json;
  created_at: string; updated_at: string;
};
export type ChestOperationRow = {
  id: string; traveler_id: string; operation_key: string; operation_type: string;
  chest_type: string; source: string; price_paid: number | null; rewards: Json | null; created_at: string;
};
export type ChestPurchaseResult = { chestType: string; quantityAdded: number; coins: number; pricePaid: number; duplicate: boolean };
export type ChestOpenResult = { chestType: string; coins: number; itemId: string | null; itemName: string | null; source: string; remainingQuantity: number; duplicate: boolean };
export type GuildMemberSummary = { traveler_id: string; traveler_name: string; role: string; member_status: string; joined_at: string };
export type GuildJoinRequestSummary = { request_id: string; traveler_id: string; traveler_name: string; request_status: string; created_at: string };
export type GuildMissionProgressSummary = { traveler_id: string; traveler_name: string; progress_status: string; completion_note: string | null; submitted_at: string | null; completed_at: string | null };

export type Database = {
  public: {
    Tables: {
      story_progress: TableDefinition<import('../../features/story/progression').StoryProgress, never, never>;
      guild_chat_messages: TableDefinition<GuildChatMessageRow, never, never>;
      guild_chat_reads: TableDefinition<{guild_id: string; user_id: string; last_read_sequence: number}, never, never>;
      guild_chat_reports: TableDefinition<GuildChatReportRow, never, never>;
      guild_chat_moderation_log: TableDefinition<GuildChatLogRow, never, never>;
      profiles: TableDefinition<
        ProfileRow,
        { id: string; display_name?: string | null },
        { display_name?: string | null }
      >;
      travelers: TableDefinition<
        TravelerRow,
        Omit<TravelerRow, 'created_at' | 'updated_at'> &
          Partial<Pick<TravelerRow, 'id' | 'level' | 'xp' | 'is_active'>>,
        Partial<
          Omit<TravelerRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>
        >
      >;
      traveler_stats: TableDefinition<
        TravelerStatsRow,
        Pick<TravelerStatsRow, 'traveler_id'> &
          Partial<
            Pick<
              TravelerStatsRow,
              'base_life' | 'base_strength' | 'base_defense' | 'base_wisdom'
            >
          >,
        Partial<
          Pick<
            TravelerStatsRow,
            'base_life' | 'base_strength' | 'base_defense' | 'base_wisdom'
          >
        >
      >;
      wallets: TableDefinition<
        WalletRow,
        Pick<WalletRow, 'traveler_id'> & Partial<Pick<WalletRow, 'coins'>>,
        Partial<Pick<WalletRow, 'coins'>>
      >;
      inventory: TableDefinition<
        InventoryRow,
        Pick<InventoryRow, 'traveler_id' | 'item_id'> &
          Partial<Pick<InventoryRow, 'id' | 'quantity' | 'metadata'>>,
        Partial<Pick<InventoryRow, 'quantity' | 'metadata'>>
      >;
      equipped_items: TableDefinition<
        EquippedItemRow,
        Pick<EquippedItemRow, 'traveler_id' | 'slot' | 'item_id'>,
        Pick<EquippedItemRow, 'item_id'>
      >;
      guilds: TableDefinition<GuildRow, never, never>;
      guild_members: TableDefinition<GuildMemberRow, never, never>;
      guild_invites: TableDefinition<GuildInviteRow, never, never>;
      guild_join_requests: TableDefinition<GuildJoinRequestRow, never, never>;
      guild_missions: TableDefinition<GuildMissionRow, never, never>;
      guild_lessons: TableDefinition<GuildLessonRow, never, never>;
      guild_mission_progress: TableDefinition<GuildMissionProgressRow, never, never>;
      guild_reward_claims: TableDefinition<GuildRewardClaimRow, never, never>;
      guild_activity_log: TableDefinition<GuildActivityRow, never, never>;
      traveler_chests: TableDefinition<TravelerChestRow, never, never>;
      chest_operations: TableDefinition<ChestOperationRow, never, never>;
    };
    Views: Record<string, never>;
    Functions: {
      ebd_member_invite_create: {
        Args: {
          p_actor: string;
          p_guild: string;
          p_class: string | null;
          p_request: string;
          p_days: number;
          p_uses: number;
        };
        Returns: Json;
      };
      ebd_member_invite_list: {
        Args: { p_actor: string; p_guild: string; p_class: string | null };
        Returns: Json;
      };
      ebd_member_invite_revoke: {
        Args: {
          p_actor: string;
          p_guild: string;
          p_class: string | null;
          p_id: string;
        };
        Returns: Json;
      };
      ebd_member_invite_preview: { Args: { p_token: string }; Returns: Json };
      ebd_member_invite_accept: {
        Args: { p_actor: string; p_token: string; p_request: string };
        Returns: Json;
      };
      ebd_classes_workspace: {
        Args: { p_actor: string; p_guild: string; p_class: string | null };
        Returns: Json;
      };
      ebd_class_lessons_workspace: {
        Args: { p_actor:string; p_guild:string; p_class:string; p_offset:number };
        Returns: Json;
      };
      guild_activity_workspace: {
        Args: { p_actor: string; p_guild: string; p_offset?: number };
        Returns: Json;
      };
      guild_challenges_workspace: {
        Args: { p_actor: string; p_guild: string; p_event?: string | null; p_offset?: number };
        Returns: Json;
      };
      guild_challenges_command: {
        Args: { p_actor: string; p_guild: string; p_action: string; p_event: string; p_request: string; p_revision: number; p_data: Json };
        Returns: Json;
      };
      guild_activity_command: {
        Args: { p_actor: string; p_guild: string; p_action: string; p_id: string; p_request: string; p_revision: number; p_data: Json };
        Returns: Json;
      };
      ebd_class_lessons_command: {
        Args: { p_actor:string; p_guild:string; p_class:string; p_action:string; p_id:string; p_request:string; p_revision:number; p_data:Json };
        Returns: Json;
      };
      ebd_classes_command: {
        Args: {
          p_actor: string;
          p_guild: string;
          p_class: string;
          p_action: string;
          p_request: string;
          p_revision: number;
          p_data: Json;
        };
        Returns: Json;
      };

      guild_scoped_status: { Args: Record<string, never>; Returns: Json };
      guild_scoped_contexts: { Args: { p_actor: string }; Returns: Json };
      guild_scoped_command: {
        Args: {
          p_actor: string;
          p_guild: string;
          p_action: string;
          p_id: string;
          p_request: string;
          p_data: Json;
        };
        Returns: Json;
      };
      guild_scoped_members: {
        Args: { p_actor: string; p_guild: string };
        Returns: GuildMemberSummary[];
      };
      guild_scoped_requests: {
        Args: { p_actor: string; p_guild: string };
        Returns: GuildJoinRequestSummary[];
      };
      guild_scoped_ebd_workspace: {
        Args: { p_actor: string; p_guild: string; p_offset: number };
        Returns: Json;
      };
      guild_scoped_ebd_command: {
        Args: {
          p_actor: string;
          p_guild: string;
          p_action: string;
          p_id: string;
          p_revision: number;
          p_data: Json;
        };
        Returns: Json;
      };
      guild_scoped_create_invite: {
        Args: { p_actor: string; p_guild: string; p_request: string };
        Returns: Json;
      };
      guild_scoped_list_invites: {
        Args: { p_actor: string; p_guild: string };
        Returns: Json;
      };
      guild_scoped_revoke_invite: {
        Args: { p_actor: string; p_guild: string; p_id: string };
        Returns: undefined;
      };
      guild_governance_status: { Args: Record<string, never>; Returns: Json };
      guild_governance_workspace: { Args: { p_offset: number }; Returns: Json };
      guild_governance_history: { Args: { p_offset: number }; Returns: Json };
      guild_leadership_preview: { Args: { p_token: string }; Returns: Json };
      guild_governance_command: { Args: { p_action: string; p_id: string; p_request: string; p_data: Json }; Returns: Json };
      set_owned_equipment: {
        Args: { p_traveler_id: string; p_slot: string; p_item_id: string | null; p_expected_item_id: string | null };
        Returns: Json;
      };
      guild_ebd_workspace: {Args: {p_actor: string; p_offset: number}; Returns: Json};
      guild_ebd_command: {Args: {p_actor: string; p_action: string; p_id: string; p_revision: number; p_data: Json}; Returns: Json};
      guild_mission_workspace: { Args: { p_actor: string; p_history_offset: number }; Returns: Json };
      save_guild_mission_v2: { Args: { p_actor: string; p_mission: string; p_expected_revision: number; p_data: Json }; Returns: string };
      transition_guild_mission_v2: { Args: { p_actor: string; p_mission: string; p_expected_revision: number; p_action: string }; Returns: undefined };
      act_guild_mission_v2: { Args: { p_actor: string; p_mission: string; p_action: string; p_note: string; p_request: string; p_expected_attempt: number }; Returns: string };
      review_guild_mission_v2: { Args: { p_actor: string; p_attempt: string; p_revision: number; p_decision: string; p_reason: string; p_request: string }; Returns: string };
      complete_story: { Args: { p_traveler_id: string; p_story_id: string }; Returns: boolean };
      send_guild_chat_message: { Args: {p_guild_id: string; p_traveler_id: string; p_client_id: string; p_body: string; p_announcement: boolean}; Returns: string };
      guild_chat_summary: {Args: {p_guild_id: string; p_traveler_id: string}; Returns: GuildChatSummary[]};
      mark_guild_chat_read: {Args: {p_guild_id: string; p_traveler_id: string; p_sequence: number}; Returns: undefined};
      report_guild_chat_message: {Args: {p_guild_id: string; p_traveler_id: string; p_message_id: string; p_reason: string}; Returns: undefined};
      moderate_guild_chat_message: {Args: {p_guild_id: string; p_traveler_id: string; p_message_id: string; p_action: string; p_reason: string}; Returns: undefined};
      create_traveler: {
        Args: {
          p_id: string;
          p_name: string;
          p_body_type: string;
          p_skin_tone: string;
          p_hair_style: string;
          p_hair_color: string | null;
          p_avatar_variant: string | null;
        };
        Returns: string;
      };
      get_owned_cards: { Args: { p_traveler_id: string }; Returns: Json };
      set_active_traveler: {
        Args: { p_traveler_id: string };
        Returns: undefined;
      };
      add_coins: {
        Args: { p_traveler_id: string; p_amount: number };
        Returns: number;
      };
      spend_coins: {
        Args: { p_traveler_id: string; p_amount: number };
        Returns: number;
      };
      create_guild: { Args: { p_leader_traveler_id: string; p_name: string; p_description?: string | null }; Returns: string };
      request_join_guild: { Args: { p_guild_id: string; p_traveler_id: string }; Returns: string };
      create_guild_link_invite: { Args: { p_leader_traveler_id: string }; Returns: Json };
      list_guild_link_invites: { Args: { p_leader_traveler_id: string }; Returns: Json };
      resolve_guild_link_invite: { Args: { p_token: string }; Returns: Json };
      preview_guild_link_invite: { Args: { p_token: string }; Returns: Json };
      request_guild_link_invite: { Args: { p_token: string; p_traveler_id: string }; Returns: string };
      revoke_guild_link_invite: { Args: { p_invite_id: string; p_leader_traveler_id: string }; Returns: undefined };
      review_guild_join_request: { Args: { p_request_id: string; p_reviewer_traveler_id: string; p_approve: boolean }; Returns: undefined };
      leave_guild: { Args: { p_traveler_id: string }; Returns: undefined };
      create_guild_mission: { Args: {
        p_creator_traveler_id: string; p_title: string; p_description: string | null; p_mission_type: string;
        p_bible_reference: string | null; p_bible_url: string | null; p_completion_mode: string; p_reward_tier: string;
        p_starts_at: string | null; p_due_at: string | null; p_publish?: boolean; p_metadata?: Json | null;
      }; Returns: string };
      publish_guild_mission: { Args: { p_mission_id: string; p_leader_traveler_id: string }; Returns: undefined };
      start_guild_mission: { Args: { p_mission_id: string; p_traveler_id: string }; Returns: string };
      submit_guild_mission: { Args: { p_mission_id: string; p_traveler_id: string; p_completion_note?: string | null }; Returns: string };
      review_guild_mission: { Args: { p_mission_id: string; p_member_traveler_id: string; p_reviewer_traveler_id: string; p_approve: boolean }; Returns: string };
      list_guild_members: { Args: { p_requester_traveler_id: string }; Returns: GuildMemberSummary[] };
      list_guild_join_requests: { Args: { p_leader_traveler_id: string }; Returns: GuildJoinRequestSummary[] };
      list_guild_mission_progress: { Args: { p_mission_id: string; p_leader_traveler_id: string }; Returns: GuildMissionProgressSummary[] };
      update_guild_mission_draft: { Args: { p_mission_id: string; p_leader_traveler_id: string; p_title: string; p_description: string | null; p_mission_type: string; p_bible_reference: string | null; p_bible_url: string | null; p_completion_mode: string; p_reward_tier: string; p_starts_at: string | null; p_due_at: string | null }; Returns: undefined };
      delete_guild_mission_draft: { Args: { p_mission_id: string; p_leader_traveler_id: string }; Returns: undefined };
      close_guild_mission: { Args: { p_mission_id: string; p_leader_traveler_id: string }; Returns: undefined };
      remove_guild_member: { Args: { p_member_traveler_id: string; p_leader_traveler_id: string }; Returns: undefined };
      review_guild_mission_with_guidance: { Args: { p_mission_id: string; p_member_traveler_id: string; p_reviewer_traveler_id: string; p_approve: boolean; p_guidance: string | null }; Returns: string };
      guild_admin_stats: { Args: { p_leader_traveler_id: string }; Returns: GuildAdminMissionStats[] };
      save_guild_lesson: { Args: {
        p_lesson_id: string | null; p_leader_traveler_id: string; p_title: string; p_theme: string;
        p_bible_reference: string; p_bible_url: string | null; p_introduction: string; p_content: string;
        p_main_points: Json; p_discussion_questions: Json; p_activity_text: string | null;
        p_scheduled_at: string | null; p_related_mission_id: string | null; p_publish: boolean;
      }; Returns: string };
      set_guild_lesson_status: { Args: { p_lesson_id: string; p_leader_traveler_id: string; p_status: string }; Returns: undefined };
      guild_public_member_profile: { Args: { p_requester_traveler_id: string; p_member_traveler_id: string }; Returns: { level: number; completed_missions: number }[] };
      purchase_chest: { Args: { p_traveler_id: string; p_chest_type: string; p_operation_id: string }; Returns: ChestPurchaseResult };
      open_chest: { Args: { p_traveler_id: string; p_chest_type: string; p_operation_id: string }; Returns: ChestOpenResult };
      claim_chest_reward: { Args: { p_traveler_id: string; p_reward_key: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
