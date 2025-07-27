import { useState, useCallback, useRef } from 'react';
import React, { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UseVoiceInputOptions {
  onTranscript: (transcript: string, isVoice: boolean) => void;
}

export const useVoiceInput = ({ onTranscript }: UseVoiceInputOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [networkRetryCount, setNetworkRetryCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setTranscript('');
    setNetworkRetryCount(0);
    setIsProcessing(false);
    try {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        toast.error('Speech recognition is not supported in this browser.');
        setIsRecording(false);
        return;
      }
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      let transcriptSent = false;
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcriptResult = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setTranscript(transcriptResult);
        finalTranscriptRef.current = transcriptResult;
      };
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        toast.error(`Speech recognition error: ${event.error}`);
        setIsProcessing(false);
        setIsRecording(false);
      };
      recognition.onend = () => {
        setIsRecording(false);
        setIsProcessing(false);
        if (finalTranscriptRef.current) {
          onTranscriptRef.current(finalTranscriptRef.current, true);
          finalTranscriptRef.current = ''; // Clear after sending
          setTranscript(''); // Clear UI transcript as well
        }
      };
      recognitionRef.current = recognition;
      setIsProcessing(true);
      recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsRecording(false);
      setIsProcessing(false);
      toast.error('Could not start speech recognition.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    isProcessing,
    networkRetryCount
  };
};