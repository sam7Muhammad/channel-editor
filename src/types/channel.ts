export type ServiceType = 'HD TV' | 'SD TV' | 'Radio' | 'Data' | 'Other';

export interface Channel {
  srvId: string; // 64-bit ID stored as string
  chId: string;
  major: number; // Display Channel Number (#)
  minor: number;
  srvName: string; // Clean decoded name (e.g., "MBC 1", "Alkass HD")
  rawName: string; // Internal UTF-16 representation
  srvType: number;
  typeLabel: ServiceType;
  
  // Tuner/Signal details
  freq: number; // Frequency in kHz / MHz (e.g. 11470000 -> 11.470 GHz)
  pol?: number; // 0=Horizontal, 1=Vertical
  sr?: number;  // Symbol rate
  mod?: number; // Modulation
  satId?: number;
  satName?: string;
  
  // Flags
  lockMode: boolean; // Parental lock
  hidden: boolean;   // Hidden in TV guide
  scrambled: boolean;// Encrypted / Pay TV
  
  // Signal telemetry
  sigStr: number;    // Signal Strength
  sigQa: number;     // Signal Quality (higher is better)
  bitErr: number;    // Bit Error Rate (lower is better)
  signalScore: number; // Calculated quality score
  
  // DVB & Provider
  lcn?: number;
  provName?: string;
  
  // Favorites (list numbers 1..5 this channel belongs to)
  favs: number[];
  
  // AI / Analysis flags
  isJunk?: boolean;
  isDuplicate?: boolean;
  duplicateGroupId?: string;
  category?: string;
}

export interface Satellite {
  satId: number;
  satName: string;
  satDir?: number;
  satPos?: number;
}

export interface FavoriteEntry {
  sfavId?: number;
  srvId: string;
  fav: number; // 1 to 5
  pos: number; // 0-indexed position in the favorite list
}

export interface MetadataInfo {
  analogCountry?: string;
  digitalCountry?: string;
  seiVersion?: string;
  rawXml: string;
}

export interface DuplicateGroup {
  name: string;
  bestChannel: Channel;
  duplicates: Channel[];
}

export interface AIOrganizeResult {
  junkSrvIds: string[];
  duplicateGroups: {
    name: string;
    keepSrvId: string;
    hideSrvIds: string[];
    reason?: string;
  }[];
  categories: {
    categoryName: string;
    categoryIcon: string;
    srvIds: string[];
  }[];
  aiResponse?: string;
}

export interface ChannelFilter {
  searchQuery: string;
  typeFilter: 'all' | 'tv' | 'radio' | 'data';
  satelliteId: number | 'all';
  encryptionFilter: 'all' | 'fta' | 'scrambled';
  visibilityFilter: 'all' | 'visible' | 'hidden';
  favoriteFilter: number | 'all'; // 1-5 or 'all'
  categoryFilter: string | 'all';
}

export type SortField = 'major' | 'name' | 'freq' | 'signal' | 'type';
export type SortDirection = 'asc' | 'desc';

export interface AppSettings {
  geminiApiKey: string;
  theme: 'dark' | 'light';
  language: 'en' | 'ar';
  autoBackup: boolean;
  scoringWeightQuality: number;
  scoringWeightError: number;
}
