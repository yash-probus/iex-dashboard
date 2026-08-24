import React, { useRef, useEffect } from 'react';
import { Box } from '@mui/material';

interface CanvasCaptchaProps {
  code: string;
}

export default function CanvasCaptcha({ code }: CanvasCaptchaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);
    
    // Draw light background
    ctx.fillStyle = '#ffffff'; // White
    ctx.fillRect(0, 0, width, height);

    // Draw some random dots (noise)
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 2,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(13, 71, 161, ${Math.random() * 0.5})`; // Dark blue dots
      ctx.fill();
    }

    // Draw random lines
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.strokeStyle = `rgba(13, 71, 161, ${Math.random() * 0.5})`; // Dark blue lines
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.stroke();
    }

    // Draw text
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0d47a1'; // Dark blue text

    // Add some random rotation/transformation for each character
    const charWidth = width / (code.length + 1);
    for (let i = 0; i < code.length; i++) {
      ctx.save();
      const x = charWidth * (i + 1);
      const y = height / 2;
      
      ctx.translate(x, y);
      const angle = (Math.random() - 0.5) * 0.4;
      ctx.rotate(angle);
      
      // Slight vertical jitter
      const jitter = (Math.random() - 0.5) * 5;
      
      ctx.fillText(code[i], 0, jitter);
      ctx.restore();
    }
  }, [code]);

  return (
    <Box
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.1)',
        height: 40
      }}
    >
      <canvas ref={canvasRef} width={120} height={40} style={{ display: 'block' }} />
    </Box>
  );
}
