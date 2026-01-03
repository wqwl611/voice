import React from 'react';
import {
  Play, Pause, Trash2, Search, Sidebar, MoreHorizontal,
  RotateCcw, RotateCw, Mic, ChevronLeft, Repeat, Repeat1, ArrowRight,
  Music, SkipForward, SkipBack, Shuffle, ArrowUpDown, Calendar, Clock, Plus
} from 'lucide-react';

export const PlayIcon = ({ size=20, className="" }) => <Play size={size} className={className} fill="currentColor" />;
export const PauseIcon = ({ size=20, className="" }) => <Pause size={size} className={className} fill="currentColor" />;
export const TrashIcon = ({ size=18, className="" }) => <Trash2 size={size} className={className} />;
export const SearchIcon = ({ size=16, className="" }) => <Search size={size} className={className} />;
export const SidebarIcon = ({ size=20, className="" }) => <Sidebar size={size} className={className} />;
export const MoreIcon = ({ size=20, className="" }) => <MoreHorizontal size={size} className={className} />;
export const Rewind15Icon = ({ size=22, className="" }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <RotateCcw size={size} strokeWidth={2} />
    <span className="absolute text-[8px] font-bold pt-1">15</span>
  </div>
);
export const Forward15Icon = ({ size=22, className="" }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <RotateCw size={size} strokeWidth={2} />
    <span className="absolute text-[8px] font-bold pt-1">15</span>
  </div>
);
export const MicIcon = ({ size=24, className="" }) => <Mic size={size} className={className} />;
export const BackIcon = ({ size=24, className="" }) => <ChevronLeft size={size} className={className} />;
export const RepeatAllIcon = ({ size=18, className="" }) => <Repeat size={size} className={className} />;
export const RepeatOneIcon = ({ size=18, className="" }) => <Repeat1 size={size} className={className} />;
export const SequentialIcon = ({ size=18, className="" }) => <ArrowRight size={size} className={className} />;

export const MusicIcon = ({ size=18, className="" }) => <Music size={size} className={className} />;
export const NextIcon = ({ size=24, className="" }) => <SkipForward size={size} className={className} fill="currentColor" />;
export const PrevIcon = ({ size=24, className="" }) => <SkipBack size={size} className={className} fill="currentColor" />;
export const RepeatIcon = RepeatAllIcon;
export const ShuffleIcon = ({ size=18, className="" }) => <Shuffle size={size} className={className} />;
export const SortIcon = ({ size=16, className="" }) => <ArrowUpDown size={size} className={className} />;
export const CalendarIcon = ({ size=16, className="" }) => <Calendar size={size} className={className} />;
export const ClockIcon = ({ size=16, className="" }) => <Clock size={size} className={className} />;
export const PlusIcon = ({ size=20, className="" }) => <Plus size={size} className={className} />;
