import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Circle, Upload, Volume2 } from 'lucide-react';
import { dosenAPI, APP_CONFIG } from '../../services/api';

export default function DosenForm({ dosen, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    nama: dosen?.nama || '',
    gelar: dosen?.gelar || '',
  });
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
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
      mediaRecorder.start(1000);
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
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const fileReader = new FileReader();

    fileReader.onload = function() {
      audioContext.decodeAudioData(fileReader.result, (buffer) => {
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

    const wavBuffer = new ArrayBuffer(44 + interleaved.length * 2);
    const view = new DataView(wavBuffer);

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

    let offset = 44;
    for (let i = 0; i < interleaved.length; i++) {
      const sample = Math.max(-1, Math.min(1, interleaved[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nama', formData.nama);
      formDataToSend.append('gelar', formData.gelar);
      
      // Jika ada rekaman audio, kirim sebagai file
      if (audioBlob) {
        const audioFile = new File([audioBlob], `sample_${Date.now()}.wav`, { 
          type: 'audio/wav' 
        });
        formDataToSend.append('sample_suara', audioFile);
      }

      if (dosen) {
        await dosenAPI.update(dosen.id, formDataToSend);
      } else {
        await dosenAPI.create(formDataToSend);
      }

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setRecordingDuration(0);
    setError('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Data Dosen */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Dosen *
          </label>
          <input
            type="text"
            required
            value={formData.nama}
            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            className="input-field"
            placeholder="Masukkan nama lengkap dosen"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gelar
          </label>
          <input
            type="text"
            value={formData.gelar}
            onChange={(e) => setFormData({ ...formData, gelar: e.target.value })}
            className="input-field"
            placeholder="Contoh: S.T., M.T."
          />
        </div>
      </div>

      {/* Rekaman Sample Suara */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Sample Suara</h3>
        <p className="text-sm text-gray-600 mb-4">
          Rekam sample suara dosen untuk sistem recognition. Rekaman yang jelas akan meningkatkan akurasi identifikasi.
        </p>

        {/* Recording Controls */}
        <div className="space-y-4">
          {!isRecording && !audioBlob && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                <Mic className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-gray-600 mb-3">
                Klik tombol di bawah untuk mulai merekam sample suara
              </p>
              <button
                type="button"
                onClick={startRecording}
                className="btn-primary flex items-center space-x-2 mx-auto"
              >
                <Mic className="h-4 w-4" />
                <span>Mulai Rekam</span>
              </button>
            </div>
          )}

          {isRecording && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-3 mx-auto animate-pulse">
                <Circle className="h-6 w-6 text-red-600 fill-red-600" />
              </div>
              <div className="text-xl font-mono font-bold text-red-600 mb-2">
                {formatTime(recordingTime)}
              </div>
              <p className="text-gray-600 mb-3">Sedang merekam... </p>
              <button
                type="button"
                onClick={stopRecording}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2 mx-auto"
              >
                <Square className="h-4 w-4" />
                <span>Stop Rekam</span>
              </button>
            </div>
          )}

          {audioBlob && !isRecording && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-600 flex items-center">
                  <Volume2 className="h-4 w-4 mr-1" />
                  Rekaman selesai ({formatTime(recordingDuration)})
                </span>
                <button
                  type="button"
                  onClick={handleRetryRecording}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Rekam ulang
                </button>
              </div>
              
              <audio controls className="w-full">
                <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                Browser Anda tidak mendukung pemutar audio.
              </audio>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <h4 className="font-medium text-blue-800 mb-2 text-sm">Tips Rekaman yang Baik:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Gunakan lingkungan yang tenang</li>
            <li>• Bicara dengan jelas dan natural</li>
            <li>• Jarak ideal 15-30 cm dari mikrofon</li>
            <li>• Rekam minimal 10-30 detik</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          disabled={loading || isRecording}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex-1"
        >
          {loading ? 'Menyimpan...' : dosen ? 'Update Dosen' : 'Simpan Dosen'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading || isRecording}
          className="btn-secondary disabled:opacity-50"
        >
          Batal
        </button>
      </div>

      {/* Status Info */}
      {dosen?.path_sample_suara && !audioBlob && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            <strong>Info:</strong> Dosen ini sudah memiliki sample suara. Rekam ulang untuk mengganti sample suara yang ada.
          </p>
        </div>
      )}
    </form>
  );
}