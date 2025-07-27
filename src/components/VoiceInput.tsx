import React from 'react';
import { Mic, Square, RefreshCw, Loader2 } from 'lucide-react';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface VoiceInputProps {
  onTranscript: (text: string, isVoice: boolean) => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript }) => {
  const { isRecording, transcript, startRecording, stopRecording, isProcessing, networkRetryCount } = useVoiceInput({ onTranscript });

  const handleVoiceInput = () => {
    if (isRecording) {
      stopRecording();
      // We'll let the useEffect handle the transcript
    } else {
      startRecording();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleVoiceInput}
        disabled={isProcessing}
        className={`
          p-3 rounded-full transition-all duration-300 flex items-center justify-center
          ${isRecording 
            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
            : isProcessing
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
        `}
        title={isRecording ? 'Stop recording' : isProcessing ? 'Processing audio...' : 'Start voice input'}
      >
        {isRecording ? (
          <Square className="w-5 h-5" />
        ) : isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {(isRecording || isProcessing) && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap">
          <div className="flex items-center gap-2">
            {isProcessing ? (
              <>
                <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                <span>Processing audio...</span>
              </>
            ) : networkRetryCount > 0 ? (
              <>
                <RefreshCw className="w-3 h-3 text-yellow-500 animate-spin" />
                <span>Retrying... ({networkRetryCount}/3)</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span>Recording...</span>
              </>
            )}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black" />
        </div>
      )}

      {transcript && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm max-w-64">
          <p className="truncate">{transcript}</p>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  );
};