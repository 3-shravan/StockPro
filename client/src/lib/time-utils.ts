/**
 * ─── Time Utils ─────────────────────────────────────────────────────────────
 * Lightweight alternative to date-fns to avoid dependency issues.
 */

export const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years";
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months";
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days";
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours";
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes";
  
  return Math.floor(seconds) + " seconds";
};

export const format = (date: Date, formatStr: string): string => {
  // Simple subset of date-fns format
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  if (formatStr === 'MMM dd, yyyy') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${pad(date.getDate())}, ${date.getFullYear()}`;
  }
  
  if (formatStr === 'HH:mm:ss') {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
  
  return date.toLocaleDateString();
};
