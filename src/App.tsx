import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Home, Building2 } from "lucide-react";

interface Message {
  type: "user" | "assistant";
  content: string;
  audioUrl?: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "assistant",
      content:
        "Hello! I'm your voice assistant. Click the microphone to start speaking.",
    },
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const formData = new FormData();
        formData.append("audio_file", audioBlob, "recording.webm");

        // Log FormData contents
        console.log("FormData contents:");
        for (const pair of formData.entries()) {
          console.log(pair[0], pair[1]);
        }
        console.log("Audio Blob size:", audioBlob.size, "bytes");
        console.log("Audio Blob type:", audioBlob.type);

        // Add user's recording indicator
        setMessages((prev) => [
          ...prev,
          { type: "user", content: "Recording sent..." },
        ]);

        try {
          const response = await fetch("http://localhost:8000/voice/", {
            method: "POST",
            body: formData,
          });
          const data = await response.json();

          setMessages((prev) => [
            ...prev,
            {
              type: "assistant",
              content: data.text,
              audioUrl: data.audio_url
                ? `http://localhost:8000${data.audio_url}`
                : undefined,
            },
          ]);
        } catch (error) {
          console.error("Fetch error:", error);
          setMessages((prev) => [
            ...prev,
            {
              type: "assistant",
              content:
                "Sorry, I had trouble processing your request. Please try again.",
            },
          ]);
        }

        audioChunksRef.current = [];
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("MediaRecorder error:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: "Please allow microphone access to use voice features.",
        },
      ]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-emerald-600 text-white p-4 fixed top-0 w-full z-10">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Home className="w-6 h-6" />
          <h1 className="text-xl font-semibold">Voice Chatbot</h1>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-2xl mx-auto pt-16 pb-24">
        <div className="p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg p-4 max-w-[80%] ${
                  message.type === "user"
                    ? "bg-emerald-500 text-white"
                    : "bg-white shadow-md"
                }`}
              >
                {message.type === "assistant" && (
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5" />
                    <span className="font-medium">Voice Assistant</span>
                  </div>
                )}
                <p className="text-sm">{message.content}</p>
                {message.audioUrl && (
                  <audio className="mt-2" controls src={message.audioUrl} />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Recording Controls */}
      <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto flex justify-center">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-4 rounded-full transition-all ${
              isRecording
                ? "bg-red-500 hover:bg-red-600"
                : "bg-emerald-500 hover:bg-emerald-600"
            } text-white`}
          >
            {isRecording ? (
              <MicOff className="w-6 h-6 animate-pulse" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
