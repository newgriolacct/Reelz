interface MiniChartProps {
  data: number[];
  isPositive: boolean;
}

export const MiniChart = ({ data, isPositive }: MiniChartProps) => {
  const width = 160;
  const height = 80;
  const padding = 4;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const strokeColor = isPositive ? 'hsl(var(--positive))' : 'hsl(var(--negative))';
  const fillColor = isPositive 
    ? 'url(#gradient-positive)' 
    : 'url(#gradient-negative)';

  return (
    <svg 
      width={width} 
      height={height} 
      className="w-full h-full"
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id="gradient-positive" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--positive))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--positive))" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gradient-negative" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--negative))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--negative))" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      <polyline
        points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
        fill={fillColor}
        stroke="none"
      />
      
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
