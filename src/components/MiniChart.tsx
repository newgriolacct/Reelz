import { useEffect, useRef, useState } from "react";

interface MiniChartProps {
  data: number[];
  isPositive: boolean;
  isLive?: boolean;
}

export const MiniChart = ({ data, isPositive, isLive = true }: MiniChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [liveData, setLiveData] = useState(data);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isLive) {
      setLiveData(data);
      return;
    }

    // Simulate live updates
    const interval = setInterval(() => {
      setLiveData(prev => {
        const newData = [...prev.slice(1)];
        const lastValue = prev[prev.length - 1];
        const change = (Math.random() - 0.5) * 10;
        newData.push(Math.max(50, lastValue + change));
        return newData;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive, data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 20;

    const min = Math.min(...liveData);
    const max = Math.max(...liveData);
    const range = max - min || 1;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = padding + (height - padding * 2) * (i / 4);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Calculate points
    const points = liveData.map((value, index) => {
      const x = padding + (index / (liveData.length - 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return { x, y };
    });

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    if (isPositive) {
      gradient.addColorStop(0, 'rgba(69, 219, 128, 0.3)');
      gradient.addColorStop(1, 'rgba(69, 219, 128, 0)');
    } else {
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding);
    points.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.lineTo(points[points.length - 1].x, height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw line with glow
    ctx.strokeStyle = isPositive ? 'rgb(69, 219, 128)' : 'rgb(239, 68, 68)';
    ctx.lineWidth = 3;
    ctx.shadowColor = isPositive ? 'rgba(69, 219, 128, 0.5)' : 'rgba(239, 68, 68, 0.5)';
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.stroke();

    // Draw dot at the end
    const lastPoint = points[points.length - 1];
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = isPositive ? 'rgb(69, 219, 128)' : 'rgb(239, 68, 68)';
    ctx.fill();

    // Inner dot
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgb(11, 15, 20)';
    ctx.fill();

  }, [liveData, isPositive]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={400}
      className="w-full h-full"
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
};
