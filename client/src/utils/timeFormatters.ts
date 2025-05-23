export const formatHours = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (wholeHours === 0) {
    return `${minutes} minutes`;
  }
  
  if (wholeHours === 1) {
    return `1 hour${minutes > 0 ? ` ${minutes} minutes` : ''}`;
  }
  
  return `${wholeHours} hours${minutes > 0 ? ` ${minutes} minutes` : ''}`;
};

export const formatElapsedTime = (clockInTime: string): string => {
  const start = new Date(clockInTime).getTime();
  const now = new Date().getTime();
  const diffInMinutes = Math.floor((now - start) / (1000 * 60));
  
  const hours = Math.floor(diffInMinutes / 60);
  const minutes = diffInMinutes % 60;
  
  if (hours === 0) {
    return `${minutes} minutes`;
  }
  
  if (hours === 1) {
    return `1 hour ${minutes} minutes`;
  }
  
  return `${hours} hours ${minutes} minutes`;
}; 