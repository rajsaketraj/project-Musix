import React, { useRef, useEffect } from "react";

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isActive: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioRef,
  isActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const setupCompletedRef = useRef<boolean>(false);

  // Initialize and clean up the audio context and visualization
  useEffect(() => {
    console.log("AudioVisualizer effect triggered, isActive =", isActive);

    // Don't do anything if we're not active or missing canvas/audio
    if (!isActive || !canvasRef.current || !audioRef.current) {
      // If we're not active, make sure we clean up any ongoing animations
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      return;
    }

    // Setup canvas
    const canvas = canvasRef.current;
    canvas.width = 800;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");

    if (!ctx || !audioRef.current) return;

    // Setup audio context and analyzer if not already done
    const setupAudioContext = async () => {
      if (setupCompletedRef.current && audioContextRef.current) {
        console.log("Audio context already set up, starting animation");
        animate();
        return;
      }

      try {
        console.log("Setting up new audio context");

        // Save playback state
        const wasPlaying = !audioRef.current.paused;

        // Resume existing audio context or create a new one
        if (audioContextRef.current) {
          if (audioContextRef.current.state === "suspended") {
            await audioContextRef.current.resume();
          }
        } else {
          // Create new audio context
          const AudioContext =
            window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContext();
          if (audioContextRef.current.state === "suspended") {
            await audioContextRef.current.resume();
          }
        }

        // Create analyzer node if it doesn't exist
        if (!analyserRef.current) {
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 1024; // For detailed visualization
        }

        // Create and connect source if it doesn't exist
        if (!sourceRef.current && audioRef.current) {
          console.log("Creating media element source");
          try {
            // Ensure the audio element is properly configured
            if (audioRef.current) {
              // Set CORS attributes
              audioRef.current.crossOrigin = "anonymous";
              audioRef.current.preload = "auto";

              // Wait for the audio to be ready
              if (audioRef.current.readyState === 0) {
                await new Promise((resolve) => {
                  const handler = () => {
                    audioRef.current?.removeEventListener(
                      "canplaythrough",
                      handler
                    );
                    resolve(null);
                  };
                  audioRef.current.addEventListener("canplaythrough", handler);
                });
              }

              // Check if the audio has a src and set proper CORS headers
              if (audioRef.current.src) {
                // Ensure the audio URL is properly formatted
                const url = new URL(audioRef.current.src);
                url.searchParams.set("cors", "true");
                audioRef.current.src = url.toString();
              }
            }

            // Create source node from existing audio element
            sourceRef.current =
              audioContextRef.current.createMediaElementSource(
                audioRef.current
              );
            sourceRef.current.connect(analyserRef.current);
            analyserRef.current.connect(audioContextRef.current.destination);

            // Restore playback state if needed
            if (wasPlaying && audioRef.current.paused) {
              audioRef.current.play().catch((err) => {
                console.error("Failed to resume playback:", err);
              });
            }
          } catch (err) {
            console.error("Failed to create media element source:", err);
            // If visualization fails, just continue playing normally
            if (audioRef.current) {
              audioRef.current.play().catch((err) => {
                console.error("Failed to resume playback:", err);
              });
            }
          }
        }

        setupCompletedRef.current = true;
        console.log("Audio context setup complete");

        // Start animation
        animate();
      } catch (err) {
        console.error("Audio visualization setup error:", err);
        // If everything fails, just continue playing normally
        if (audioRef.current) {
          audioRef.current.play().catch((err) => {
            console.error("Failed to resume playback:", err);
          });
        }
      }
    };

    setupAudioContext();

    // Animation function for waveform visualization
    const animate = () => {
      // Check if still active and all references are valid
      if (!isActive || !canvasRef.current || !ctx || !analyserRef.current) {
        // Cancel animation frame when inactive
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }
        return;
      }

      // Request next frame first to ensure smooth animation
      animationFrameId.current = requestAnimationFrame(animate);

      // These checks are redundant now as they're done at the beginning of the function

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get frequency data
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Use time domain data for waveform
      analyserRef.current.getByteTimeDomainData(dataArray);

      // Draw waveform with enhanced styling
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, "#667eea");
      gradient.addColorStop(0.3, "#764ba2");
      gradient.addColorStop(0.6, "#f093fb");
      gradient.addColorStop(1, "#f5576c");

      ctx.lineWidth = 4;
      ctx.strokeStyle = gradient;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#667eea";
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * (canvas.height / 2);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Draw particle effect
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) / 3;

      // Get frequency data for the circular viz
      analyserRef.current.getByteFrequencyData(dataArray);

      // Draw frequency bars in circular pattern
      const barCount = 64;
      const angleStep = (Math.PI * 2) / barCount;

      for (let i = 0; i < barCount; i++) {
        const frequency = dataArray[i * 4] || 0;
        const barHeight = (frequency / 255) * 80;

        const angle = i * angleStep;
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        // Create gradient for each bar
        const barGradient = ctx.createLinearGradient(x1, y1, x2, y2);
        const hue = (i / barCount) * 360;
        barGradient.addColorStop(0, `hsl(${hue}, 70%, 50%)`);
        barGradient.addColorStop(1, `hsl(${hue}, 70%, 70%)`);

        ctx.strokeStyle = barGradient;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 5;
        ctx.shadowColor = `hsl(${hue}, 70%, 50%)`;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Draw central pulse
      const avgFrequency =
        dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
      const pulseRadius = (avgFrequency / 255) * 30 + 5;

      const pulseGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        pulseRadius
      );
      pulseGradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
      pulseGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = pulseGradient;
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#fff";
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.fill();
    };

    // Start animation
    animate();

    // Cleanup function
    const cleanup = () => {
      console.log("AudioVisualizer cleanup");
      if (audioContextRef.current) {
        // Disconnect nodes
        if (sourceRef.current) {
          sourceRef.current.disconnect();
        }
        if (analyserRef.current) {
          analyserRef.current.disconnect();
        }

        // Close audio context
        audioContextRef.current.close().catch((err) => {
          console.error("Failed to close audio context:", err);
        });

        // Reset refs
        sourceRef.current = null;
        analyserRef.current = null;
        audioContextRef.current = null;
      }
    };

    return cleanup;
  }, [isActive, audioRef]);

  // This function is called when component unmounts completely
  useEffect(() => {
    return () => {
      console.log("AudioVisualizer component unmounting");
      // Clean up all resources when component unmounts completely
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }

      if (sourceRef.current && analyserRef.current) {
        try {
          sourceRef.current.disconnect(analyserRef.current);
        } catch (err) {
          // Ignore disconnection errors
        }
      }

      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect();
        } catch (err) {
          // Ignore disconnection errors
        }
      }

      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        try {
          audioContextRef.current.close();
        } catch (err) {
          // Ignore close errors
        }
      }

      sourceRef.current = null;
      analyserRef.current = null;
      audioContextRef.current = null;
      setupCompletedRef.current = false;
    };
  }, []);

  return (
    <div className="visualization-container">
      <canvas
        ref={canvasRef}
        className="visualizer-canvas"
        width="800"
        height="300"
      ></canvas>
    </div>
  );
};

export default AudioVisualizer;
