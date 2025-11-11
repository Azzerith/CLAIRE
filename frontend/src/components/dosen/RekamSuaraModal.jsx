import { useState, useRef } from 'react';
import { Mic, Square, Upload } from 'lucide-react';
import { dosenAPI, APP_CONFIG } from '../../services/api';

export default function RekamSuaraModal({ dosen, onClose, onSuccess }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Validasi size setelah rekaman
        if (audioBlob.size > APP_CONFIG.UPLOAD_MAX_SIZE) {
          setError(`Rekaman terlalu besar. Maksimal ${APP_CONFIG.UPLOAD_MAX_SIZE / 1024 / 1024}MB`);
          return;
        }
        
        setAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Tidak dapat mengakses mikrofon. Pastikan browser mengizinkan akses mikrofon.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleUpload = async () => {
    if (!audioBlob) return;

    setLoading(true);
    setError('');

    try {
      const audioFile = new File([audioBlob], `rekaman_${dosen.id}.wav`, { 
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
          <div className="flex justify-center space-x-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex items-center space-x-2 btn-primary"
              >
                <Mic className="h-4 w-4" />
                <span>Mulai Rekam</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg"
              >
                <Square className="h-4 w-4" />
                <span>Stop Rekam</span>
              </button>
            )}
          </div>

          {isRecording && (
            <div className="text-center">
              <div className="animate-pulse text-red-600 font-medium">
                ● Sedang Merekam...
              </div>
            </div>
          )}

          {audioBlob && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Preview rekaman:</p>
              <audio controls className="w-full">
                <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
              </audio>
              
              <button
                onClick={handleUpload}
                disabled={loading}
                className="flex items-center space-x-2 btn-primary w-full justify-center disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                <span>{loading ? 'Mengupload...' : 'Simpan Sample Suara'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}