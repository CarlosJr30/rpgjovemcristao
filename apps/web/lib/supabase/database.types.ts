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

export type Database = {
  public: {
    Tables: {
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
    };
    Views: Record<string, never>;
    Functions: {
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
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
