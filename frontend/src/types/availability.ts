export interface Slot {
  start: string;
  end: string;
  available: boolean;
  reason?: string;
}

export interface Conflict {
  bookingId?: string;
  start: string;
  end: string;
  spaceId?: string;
  reference?: string;
}

export interface AvError {
  code: string;
  message: string;
  details?: {
    capacity?: number | null;
    overlapping?: number;
  };
}

export interface Suggestion {
  start: string;
  end: string;
}

export interface AvailabilityResponse {
  hasConflict: boolean;
  conflicts: Conflict[];
  errors: AvError[];
  suggestions: Suggestion[];
  slots: Slot[];
}