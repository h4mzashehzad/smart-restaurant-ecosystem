export interface TourState {
  version: 1;
  step: number;
  status: 'pending' | 'active' | 'skipped' | 'completed';
  updated_at?: string;
}
export interface OnboardingData {
  tour: TourState | null;
  setup: {
    profile: boolean;
    menu: boolean;
    categories: boolean;
    tables: boolean;
    team: boolean;
    slug: string;
    restaurant_id: number;
  };
}
