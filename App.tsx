import React, { useState, useRef, useEffect } from 'react';
import { Memo, PlaybackMode, PLAYBACK_SPEEDS } from './types';
import { formatDuration, formatDate } from './utils';
import {
  PlayIcon, PauseIcon, TrashIcon, SearchIcon,
  Rewind15Icon, Forward15Icon, MicIcon,
  RepeatAllIcon, RepeatOneIcon, SequentialIcon, PlusIcon
} from './components/Icons';
import { Waveform } from './components/Waveform';

export default function App() {
  // --- State ---
  const [memos, setMemos] = useState<Memo[]>([]);
  const [activeMemoId, setActiveMemoId] = useState<string | null>(null);
  
  // View State
  const [isRecording, setIsRecording] = useState(false); 
  const [recordingTime, setRecordingTime] = useState(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  
  // Default to LOOP_ALL as requested
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(PlaybackMode.LOOP_ALL);

  const [searchQuery, setSearchQuery] = useState('');

  // --- Refs ---
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(new Audio());

  // --- Audio Event Listeners ---
  useEffect(() => {
    const audio = audioRef.current;
    
    const updateTime = () => setPlaybackTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const onEnded = () => handlePlaybackEnded();
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [memos, activeMemoId, playbackMode]);

  // --- Playback Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handlePlaybackEnded = () => {
    if (playbackMode === PlaybackMode.LOOP_ONE) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      const currentIndex = memos.findIndex(m => m.id === activeMemoId);
      if (currentIndex === -1) return;

      if (playbackMode === PlaybackMode.SEQUENTIAL) {
        if (currentIndex < memos.length - 1) {
          playMemo(memos[currentIndex + 1]);
        } else {
          setIsPlaying(false);
        }
      } else if (playbackMode === PlaybackMode.LOOP_ALL) {
        // Loop back to start if at end
        const nextIndex = (currentIndex + 1) % memos.length;
        playMemo(memos[nextIndex]);
      }
    }
  };

  const playMemo = (memo: Memo) => {
    if (activeMemoId === memo.id) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
    } else {
      setActiveMemoId(memo.id);
      audioRef.current.src = memo.url;
      audioRef.current.load();
      audioRef.current.play().catch(e => console.error("Play failed", e));
    }
  };

  const skipTime = (seconds: number) => {
    const newTime = Math.min(Math.max(audioRef.current.currentTime + seconds, 0), duration);
    audioRef.current.currentTime = newTime;
  };

  const togglePlaybackMode = () => {
    const modes = [PlaybackMode.LOOP_ALL, PlaybackMode.LOOP_ONE, PlaybackMode.SEQUENTIAL];
    const nextIndex = (modes.indexOf(playbackMode) + 1) % modes.length;
    setPlaybackMode(modes[nextIndex]);
  };

  const cycleSpeed = () => {
    const idx = PLAYBACK_SPEEDS.indexOf(playbackRate);
    const next = PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length];
    setPlaybackRate(next);
  };

  // --- Recording Logic ---
  const startRecording = async () => {
    setIsRecording(true);
    // Pause any playing audio
    audioRef.current.pause(); 
    setIsPlaying(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const newMemo: Memo = {
          id: Date.now().toString(),
          title: `New Recording ${memos.length + 1}`,
          url,
          duration: recordingTime,
          createdAt: Date.now(),
          blob
        };
        
        setMemos(prev => [newMemo, ...prev]);
        setRecordingTime(0);
        
        // Auto-select
        setActiveMemoId(newMemo.id);
        audioRef.current.src = newMemo.url;
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      
      const startTime = Date.now();
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime((Date.now() - startTime) / 1000);
      }, 100);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required to record audio.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const deleteMemo = (id: string) => {
    setMemos(prev => prev.filter(m => m.id !== id));
    if (activeMemoId === id) {
      setActiveMemoId(null);
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  };

  // --- Filtering ---
  const filteredMemos = memos.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeMemo = memos.find(m => m.id === activeMemoId);

  // --- Render Helpers ---
  const getModeIcon = () => {
    switch (playbackMode) {
      case PlaybackMode.LOOP_ONE: return <RepeatOneIcon className="text-blue-500" />;
      case PlaybackMode.LOOP_ALL: return <RepeatAllIcon className="text-blue-500" />;
      default: return <SequentialIcon className="text-gray-400" />;
    }
  };

  // --------------------------------------------------------
  // VIEW 1: RECORDING PAGE (Full Screen Overlay)
  // --------------------------------------------------------
  if (isRecording) {
    return (
      <div className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-between py-12 px-6 animate-in slide-in-from-bottom duration-300">
         <div className="w-full text-center">
            <h2 className="text-gray-400 font-medium tracking-wide text-sm uppercase">Recording</h2>
         </div>

         <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg">
            <div className="text-7xl font-light font-mono mb-12 tracking-tighter">
              {formatDuration(recordingTime)}
            </div>
            
            <div className="w-full h-32 mb-8">
               <Waveform isPlaying={false} isRecording={true} />
            </div>

            <div className="text-red-500 font-medium animate-pulse tracking-wider">
               REC
            </div>
         </div>

         <div className="w-full max-w-xs flex items-center justify-center">
            <button 
              onClick={stopRecording}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 bg-red-500 rounded-md" />
            </button>
         </div>
      </div>
    );
  }

  // --------------------------------------------------------
  // VIEW 2: UNIFIED PAGE (List Top + Player Bottom)
  // --------------------------------------------------------
  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 overflow-hidden">
      
      {/* 1. Header & Search (Fixed Top) */}
      <div className="flex-none bg-[#fbfbfd] border-b border-gray-200 z-10">
        <div className="h-14 flex items-center justify-between px-4">
          <h1 className="text-xl font-bold tracking-tight">Recordings</h1>
          <button 
            onClick={startRecording}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors active:scale-95"
            title="Start Recording"
          >
             <PlusIcon size={26} />
          </button>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#e3e3e8] rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>
      </div>

      {/* 2. List (Scrollable Area) */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
        {filteredMemos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-8 text-center">
             <div className="mb-4 opacity-20"><MicIcon size={48} /></div>
             <p className="text-sm">Tap <span className="text-blue-500 font-bold">+</span> to start a new recording</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 pb-20">
            {filteredMemos.map(memo => (
              <li 
                key={memo.id}
                onClick={() => playMemo(memo)}
                className={`
                  px-5 py-4 cursor-pointer transition-colors
                  ${activeMemoId === memo.id ? 'bg-blue-50' : 'hover:bg-gray-50'}
                `}
              >
                <div className={`font-semibold text-base mb-1 truncate ${activeMemoId === memo.id ? 'text-blue-600' : 'text-gray-900'}`}>
                  {memo.title}
                </div>
                <div className="flex justify-between text-xs text-gray-500 font-medium">
                  <span>{formatDate(memo.createdAt)}</span>
                  <span>{formatDuration(memo.duration)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 3. Player Panel (Fixed Bottom) */}
      {activeMemo && (
        <div className="flex-none bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-20 pb-safe">
            <div className="max-w-3xl mx-auto">
                <div className="p-4 flex flex-col items-center">
                    {/* Title Input */}
                    <input 
                        value={activeMemo.title}
                        onChange={(e) => {
                          const newTitle = e.target.value;
                          setMemos(prev => prev.map(m => m.id === activeMemo.id ? {...m, title: newTitle} : m));
                        }}
                        className="text-lg font-bold text-center w-full bg-transparent border-none focus:ring-0 focus:underline text-gray-900 mb-4 truncate"
                    />

                    {/* Waveform (Compact) */}
                    <div className="w-full h-16 mb-4 flex items-center justify-center opacity-70">
                        <Waveform isPlaying={isPlaying} isRecording={false} />
                    </div>

                    {/* Scrubber */}
                    <div className="w-full mb-4 px-2">
                        <input 
                            type="range" 
                            min={0} 
                            max={duration || 100}
                            value={playbackTime}
                            onChange={(e) => {
                                audioRef.current.currentTime = Number(e.target.value);
                                setPlaybackTime(Number(e.target.value));
                            }}
                            className="w-full cursor-pointer accent-blue-500"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono font-medium">
                            <span>{formatDuration(playbackTime)}</span>
                            <span>-{formatDuration(duration - playbackTime)}</span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="w-full flex items-center justify-between">
                        {/* Speed & Mode */}
                        <div className="flex items-center space-x-2">
                            <button 
                                onClick={cycleSpeed}
                                className="text-[10px] font-bold w-8 py-1 rounded bg-gray-100 text-gray-600 active:bg-gray-200"
                            >
                                {playbackRate}x
                            </button>
                            <button 
                                onClick={togglePlaybackMode}
                                className="p-1.5 rounded hover:bg-gray-100 active:bg-gray-200 text-gray-600"
                                title={playbackMode}
                            >
                                {getModeIcon()}
                            </button>
                        </div>

                        {/* Transport */}
                        <div className="flex items-center space-x-6">
                            <button onClick={() => skipTime(-15)} className="text-gray-800 hover:text-blue-600 active:scale-90 transition-transform">
                                <Rewind15Icon size={24} />
                            </button>

                            <button 
                                onClick={() => isPlaying ? audioRef.current.pause() : audioRef.current.play()}
                                className="w-12 h-12 bg-gray-900 rounded-full text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                            >
                                {isPlaying ? <PauseIcon size={20} className="fill-white" /> : <PlayIcon size={20} className="ml-1 fill-white" />}
                            </button>

                            <button onClick={() => skipTime(15)} className="text-gray-800 hover:text-blue-600 active:scale-90 transition-transform">
                                <Forward15Icon size={24} />
                            </button>
                        </div>

                        {/* Delete */}
                        <button 
                            onClick={() => deleteMemo(activeMemo.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <TrashIcon size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
