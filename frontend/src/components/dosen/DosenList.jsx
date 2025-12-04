import { useState, useRef } from 'react';
import { Edit2, Trash2, Mic, Play, Users, Volume2, Pause } from 'lucide-react';
import { dosenAPI } from '../../services/api';
import RekamSuaraModal from './RekamSuaraModal';

export default function DosenList({ dosen, onEdit, onUpdate }) {
  const [showRekamModal, setShowRekamModal] = useState(false);
  const [selectedDosen, setSelectedDosen] = useState(null);
  const [loading, setLoading] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef(null);

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus dosen ini?')) return;

    setLoading(id);
    try {
      await dosenAPI.delete(id);
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setLoading(null);
    }
  };

  const handleRekamSuara = (dosen) => {
    setSelectedDosen(dosen);
    setShowRekamModal(true);
  };

  const playSampleSuara = async (dosen) => {
    // Jika audio yang sama diklik, pause audio
    if (playingAudio === dosen.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingAudio(null);
      setAudioProgress(0);
      return;
    }
  
    // Jika audio lain sedang diputar, stop dulu
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  
    if (dosen.path_sample_suara) {
      try {
        // Ekstrak folder dosen dan nama file dari path database
        const pathParts = dosen.path_sample_suara.split('\\');
        // Format: sampel_suara\Bagus_ST_MKom\e56a6e9b-fe2b-4c95-84c3-d130efc574e6.wav
        if (pathParts.length >= 3) {
          const dosenFolder = pathParts[1]; // Bagus_ST_MKom
          const filename = pathParts[2]; // e56a6e9b-fe2b-4c95-84c3-d130efc574e6.wav
          
          // Buat URL sesuai endpoint yang benar
          const audioUrl = `http://localhost:8080/api/v1/audio/${dosenFolder}/${filename}`;
          
          console.log('Playing audio from:', audioUrl); // Debug log
          
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          
          // Event listener untuk update progress
          audio.addEventListener('timeupdate', () => {
            const progress = (audio.currentTime / audio.duration) * 100;
            setAudioProgress(progress);
          });
  
          // Event listener ketika audio selesai
          audio.addEventListener('ended', () => {
            setPlayingAudio(null);
            setAudioProgress(0);
            audioRef.current = null;
          });
  
          // Event listener untuk error
          audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            setPlayingAudio(null);
            setAudioProgress(0);
            audioRef.current = null;
            alert('Gagal memutar sample suara. Pastikan file tersedia di server.');
          });
  
          setPlayingAudio(dosen.id);
          await audio.play();
        } else {
          alert('Format path file audio tidak valid');
        }
      } catch (err) {
        console.error('Error playing audio:', err);
        setPlayingAudio(null);
        setAudioProgress(0);
        audioRef.current = null;
        alert('Gagal memutar sample suara');
      }
    }
  };
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingAudio(null);
    setAudioProgress(0);
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dosen.map((d) => (
          <div 
            key={d.id} 
            className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 hover:shadow-md hover:border-indigo-200 transition-all duration-300"
          >
            {/* Header dengan nama dan tombol aksi */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-indigo-800 truncate">{d.nama}</h3>
                <p className="text-indigo-600 text-sm mt-1">{d.gelar}</p>
              </div>
              <div className="flex space-x-1 ml-3">
                {/* Tombol Play/Pause Sample Suara */}
                {d.path_sample_suara && (
                  <button
                    onClick={() => playSampleSuara(d)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      playingAudio === d.id 
                        ? 'bg-emerald-100 text-emerald-700 shadow-inner' 
                        : 'text-emerald-600 hover:bg-emerald-50 hover:shadow-sm'
                    }`}
                    title={playingAudio === d.id ? "Hentikan" : "Putar Sample Suara"}
                  >
                    {playingAudio === d.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                )}
                
                {/* Tombol Rekam Suara */}
                <button
                  onClick={() => handleRekamSuara(d)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 hover:shadow-sm"
                  title="Rekam Suara Baru"
                >
                  <Mic className="h-4 w-4" />
                </button>
                
                {/* Tombol Edit */}
                <button
                  onClick={() => onEdit(d)}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 hover:shadow-sm"
                  title="Edit Data Dosen"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                
                {/* Tombol Hapus */}
                <button
                  onClick={() => handleDelete(d.id)}
                  disabled={loading === d.id}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Hapus Dosen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Status Sample Suara dengan Progress Bar */}
            <div className="mb-4">
              {d.path_sample_suara ? (
                <div className="space-y-2">
                  <div className="flex items-center text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                    <Volume2 className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Sample suara tersedia</span>
                  </div>
                  
                  {/* Progress Bar */}
                  {playingAudio === d.id && (
                    <div className="w-full bg-emerald-100 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${audioProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                  <Mic className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Belum ada sample suara</span>
                </div>
              )}
            </div>
            
            {/* Footer dengan tanggal dibuat */}
            <div className="flex items-center justify-between pt-3 border-t border-indigo-100">
              <span className="text-xs text-indigo-400">
                Dibuat: {new Date(d.tanggal_dibuat).toLocaleDateString('id-ID')}
              </span>
              {d.path_sample_suara && (
                <div className={`w-2 h-2 rounded-full ${
                  playingAudio === d.id ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'
                }`} title="Sample suara tersedia"></div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {dosen.length === 0 && (
        <div className="text-center py-16 bg-linear-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-dashed border-indigo-200">
          <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Users className="h-10 w-10 text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-indigo-800 mb-2">Belum ada dosen</h3>
          <p className="text-indigo-600 max-w-sm mx-auto">
            Tambahkan dosen pertama Anda untuk memulai monitoring dengan sistem CLAIRE
          </p>
        </div>
      )}

      {/* Modal Rekam Suara */}
      {showRekamModal && (
        <RekamSuaraModal
          dosen={selectedDosen}
          onClose={() => {
            setShowRekamModal(false);
            stopAudio(); // Stop audio ketika modal ditutup
          }}
          onSuccess={() => {
            setShowRekamModal(false);
            stopAudio(); // Stop audio ketika sukses merekam
            onUpdate();
          }}
        />
      )}
    </>
  );
}