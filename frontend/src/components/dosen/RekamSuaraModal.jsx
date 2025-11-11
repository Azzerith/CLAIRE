import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, Circle } from 'lucide-react';
import { dosenAPI, APP_CONFIG } from '../../services/api';

export default function RekamSuaraModal({ dosen, onClose, onSuccess }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Reset state
      setError('');
      setAudioBlob(null);
      setRecordingTime(0);
      setRecordingDuration(0);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        
        // Convert to WAV format
        convertToWav(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      // Start timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingTime(elapsed);
        
        // Auto-stop after 5 minutes (300 seconds) for safety
        if (elapsed >= 300) {
          stopRecording();
        }
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Tidak dapat mengakses mikrofon. Pastikan browser mengizinkan akses mikrofon dan periksa koneksi mikrofon Anda.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingDuration(recordingTime);
    }
  };

  const convertToWav = (webmBlob) => {
    // Create a temporary audio element to play and record
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const fileReader = new FileReader();

    fileReader.onload = function() {
      audioContext.decodeAudioData(fileReader.result, (buffer) => {
        // Convert to WAV
        const wavBlob = bufferToWav(buffer);
        setAudioBlob(wavBlob);
      });
    };

    fileReader.readAsArrayBuffer(webmBlob);
  };

  const bufferToWav = (buffer) => {
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const channels = buffer.numberOfChannels;
    
    const interleaved = new Float32Array(length * channels);
    for (let channel = 0; channel < channels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        interleaved[i * channels + channel] = channelData[i];
      }
    }

    // Create WAV file
    const wavBuffer = new ArrayBuffer(44 + interleaved.length * 2);
    const view = new DataView(wavBuffer);

    // Write WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + interleaved.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, interleaved.length * 2, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < interleaved.length; i++) {
      const sample = Math.max(-1, Math.min(1, interleaved[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  const handleUpload = async () => {
    if (!audioBlob) return;

    setLoading(true);
    setError('');

    try {
      const audioFile = new File([audioBlob], `rekaman_${dosen.id}_${Date.now()}.wav`, { 
        type: 'audio/wav' 
      });
      
      await dosenAPI.rekamSuara(dosen.id, audioFile);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengupload rekaman');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRetry = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setRecordingDuration(0);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">
          Rekam Sample Suara - {dosen.nama}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Recording Controls */}
          <div className="flex flex-col items-center space-y-4">
            {!isRecording && !audioBlob && (
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Mic className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-gray-600 mb-4">
                  Klik tombol di bawah untuk mulai merekam sample suara dosen
                </p>
                <button
                  onClick={startRecording}
                  className="flex items-center space-x-2 btn-primary"
                >
                  <Mic className="h-4 w-4" />
                  <span>Mulai Rekam</span>
                </button>
              </div>
            )}

            {isRecording && (
              <div className="text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
                  <Circle className="h-8 w-8 text-red-600 fill-red-600" />
                </div>
                <div className="text-2xl font-mono font-bold text-red-600 mb-2">
                  {formatTime(recordingTime)}
                </div>
                <p className="text-gray-600 mb-2">Sedang merekam... </p>
                <p className="text-sm text-gray-500">
                  Rekam suara yang jelas untuk hasil recognition yang optimal
                </p>
                <button
                  onClick={stopRecording}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg mt-4"
                >
                  <Square className="h-4 w-4" />
                  <span>Stop Rekam</span>
                </button>
              </div>
            )}

            {audioBlob && !isRecording && (
              <div className="text-center w-full">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Mic className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-gray-600 mb-2">
                  Rekaman selesai ({formatTime(recordingDuration)})
                </p>
                
                <div className="space-y-3 w-full">
                  <p className="text-sm font-medium text-gray-700">Preview rekaman:</p>
                  <audio controls className="w-full mb-4">
                    <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                    Browser Anda tidak mendukung pemutar audio.
                  </audio>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={handleUpload}
                      disabled={loading}
                      className="flex-1 flex items-center space-x-2 btn-primary justify-center disabled:opacity-50"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{loading ? 'Mengupload...' : 'Simpan Sample'}</span>
                    </button>
                    
                    <button
                      onClick={handleRetry}
                      disabled={loading}
                      className="flex items-center space-x-2 btn-secondary disabled:opacity-50"
                    >
                      <span>Ulangi</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Tips Rekaman yang Baik:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Gunakan lingkungan yang tenang</li>
              <li>• Bicara dengan jelas dan natural</li>
              <li>• Jarak ideal 15-30 cm dari mikrofon</li>
              <li>• Rekam minimal 10-30 detik untuk hasil optimal</li>
              <li>• Hindari background noise dan gema</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}