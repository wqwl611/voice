export const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
};

export const formatTime = formatDuration;

export const formatDate = (timestamp: number): string => {
  const d = new Date(timestamp);
  const now = new Date();
  
  if (d.setHours(0,0,0,0) === now.setHours(0,0,0,0)) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  
  return d.toLocaleDateString([], { year: 'numeric', month: 'numeric', day: 'numeric' });
};
