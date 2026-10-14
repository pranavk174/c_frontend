import { mediaUploads } from "@/lib/dummy";
import { logger } from "@/lib/utils";
import { Mic } from "lucide-react";
import { useRef, useState } from "react";

interface recorederProps extends mediaUploads {
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export default function VoiceRecorder({
  setFile,
  startUpload,
}: recorederProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const drawWaveform = () => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;

    if (!analyser || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    draw();
  };
  const startRecording = async () => {
    try {
      // Ask microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const audioContext = new AudioContext();

      const source = audioContext.createMediaStreamSource(stream);

      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 256;

      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      drawWaveform();

      streamRef.current = stream;

      // Create recorder
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;

      // Reset previous chunks
      chunksRef.current = [];

      // Every time browser has audio data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // When recording stops
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: "audio/webm",
        });

        const audioFile = new File([blob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });

        const url = URL.createObjectURL(blob);

        setFile(audioFile);
        logger.debug(audioFile, "audio file dataaaaa");
        // Stop microphone
        stream.getTracks().forEach((track) => track.stop());
        setAudioUrl(url);
      };

      mediaRecorder.start();

      setIsRecording(true);
    } catch (err) {
      console.log(err);
      alert("Microphone permission denied");
    }
  };

  const stopRecording = async () => {
    
    await startUpload();
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    audioContextRef.current?.close();

    setIsRecording(false);
  };

  return (
    <div className="w-full flex justify-between bg-gray-400">
      <div className="w-7/8 flex items-center">
        {isRecording ? (
          <canvas
            ref={canvasRef}
            width={500}
            height={60}
            className="w-full h-14 rounded-md bg-black"
          />
        ) : (
          audioUrl && <audio controls src={audioUrl} className="w-full" />
        )}
      </div>
      <div className="w-1/8 flex justify-center ">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="p-2 text-wa-icon dark:text-wa-icon-dark hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition"
          >
            <Mic className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="p-2 text-wa-icon dark:text-wa-icon-dark hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
