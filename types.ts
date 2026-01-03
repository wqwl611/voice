export interface Memo {
  id: string;
  title: string;
  url: string;
  duration: number;
  createdAt: number;
  blob: Blob;
}

export enum PlaybackMode {
  SEQUENTIAL = 'SEQUENTIAL',
  LOOP_ONE = 'LOOP_ONE',
  LOOP_ALL = 'LOOP_ALL',
}

export const PLAYBACK_SPEEDS = [0.5, 1.0, 1.25, 1.5, 2.0];

export type SortOption = 'date' | 'name' | 'duration';
export type SortDirection = 'asc' | 'desc';
