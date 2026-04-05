import React, { useState, useRef, useEffect } from 'react';
import { 
  Radio as RadioIcon, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Wifi
} from 'lucide-react';
import { Button } from '@connect/components/ui/button';
import { Slider } from '@connect/components/ui/slider';
import { motion } from 'framer-motion';

export default function Radio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);

  // Replace with your actual radio stream URL
  const radioStreamUrl = 'https://stream.zeno.fm/placeholder'; // Placeholder URL

  const currentProgram = {
    title: 'Música de Adoración',
    host: 'Radio CFC',
    time: '24/7',
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing audio:', error);
      }
      setIsLoading(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        src={radioStreamUrl}
        preload="none"
      />

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        {/* Logo/Visual */}
        <motion.div
          animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className="relative mb-8"
        >
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-2xl shadow-red-500/30">
            <RadioIcon className="w-16 h-16 text-white" />
          </div>
          
          {/* Animated rings when playing */}
          {isPlaying && (
            <>
              <motion.div
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 rounded-full border-2 border-red-400"
              />
              <motion.div
                animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                className="absolute inset-0 rounded-full border-2 border-red-400"
              />
            </>
          )}
        </motion.div>

        {/* Station Info */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Radio CFC</h1>
          <p className="text-white/60 text-sm">Centro Familiar Cristiano</p>
          
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 mt-4 text-green-400"
            >
              <Wifi className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-medium">EN VIVO</span>
            </motion.div>
          )}
        </div>

        {/* Current Program */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-8 w-full max-w-xs">
          <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Ahora sonando</p>
          <h2 className="text-white font-semibold">{currentProgram.title}</h2>
          <p className="text-white/60 text-sm">{currentProgram.host}</p>
        </div>

        {/* Play Button */}
        <Button
          onClick={togglePlay}
          disabled={isLoading}
          className={`w-20 h-20 rounded-full mb-8 transition-all ${
            isPlaying 
              ? 'bg-white text-red-600 hover:bg-white/90' 
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {isLoading ? (
            <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </Button>

        {/* Volume Control */}
        <div className="w-full max-w-xs">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>
            
            <Slider
              value={[isMuted ? 0 : volume]}
              onValueChange={([val]) => {
                setVolume(val);
                if (val > 0 && isMuted) setIsMuted(false);
              }}
              max={100}
              step={1}
              className="flex-1"
            />
            
            <span className="text-white/60 text-sm w-8">{isMuted ? 0 : volume}%</span>
          </div>
        </div>

        {/* Schedule Note */}
        <div className="mt-12 text-center">
          <p className="text-white/40 text-xs">
            Transmisión disponible las 24 horas
          </p>
          <p className="text-white/40 text-xs mt-1">
            Música cristiana y programas de edificación
          </p>
        </div>
      </div>
    </div>
  );
}