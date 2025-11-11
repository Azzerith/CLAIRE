import { useState } from 'react';
import { Edit2, Trash2, Mic, Play, Users, Volume2 } from 'lucide-react';
import { dosenAPI } from '../../services/api';
import RekamSuaraModal from './RekamSuaraModal';

export default function DosenList({ dosen, onEdit, onUpdate }) {
  const [showRekamModal, setShowRekamModal] = useState(false);
  const [selectedDosen, setSelectedDosen] = useState(null);
  const [loading, setLoading] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);

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
    if (playingAudio === dosen.id) {
      setPlayingAudio(null);
      return;
    }

    if (dosen.path_sample_suara) {
      setPlayingAudio(dosen.id);
      try {
        const audioUrl = `http://localhost:8080/api/v1/audio/${dosen.path_sample_suara.split('/').pop()}`;
        const audio = new Audio(audioUrl);
        
        audio.onended = () => setPlayingAudio(null);
        audio.onerror = () => {
          setPlayingAudio(null);
          alert('Gagal memutar sample suara');
        };
        
        await audio.play();
      } catch (err) {
        setPlayingAudio(null);
        alert('Gagal memutar sample suara');
      }
    }
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dosen.map((d) => (
          <div key={d.id} className="card hover:shadow-lg transition-shadow duration-200">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800">{d.nama}</h3>
                <p className="text-gray-600">{d.gelar}</p>
              </div>
              <div className="flex space-x-1">
                {d.path_sample_suara && (
                  <button
                    onClick={() => playSampleSuara(d)}
                    className={`p-2 rounded-lg transition-colors ${
                      playingAudio === d.id 
                        ? 'bg-green-100 text-green-700' 
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={playingAudio === d.id ? "Menghentikan..." : "Putar Sample Suara"}
                  >
                    {playingAudio === d.id ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => handleRekamSuara(d)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Rekam Suara Baru"
                >
                  <Mic className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onEdit(d)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Edit Data Dosen"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(d.id)}
                  disabled={loading === d.id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Hapus Dosen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-500 mb-2">
              {d.path_sample_suara ? (
                <span className="text-green-600 flex items-center">
                  <Volume2 className="h-3 w-3 mr-1" />
                  Sample suara tersedia
                </span>
              ) : (
                <span className="text-orange-600 flex items-center">
                  <Mic className="h-3 w-3 mr-1" />
                  Belum ada sample suara
                </span>
              )}
            </div>
            
            <div className="mt-2 text-xs text-gray-400">
              Dibuat: {new Date(d.tanggal_dibuat).toLocaleDateString('id-ID')}
            </div>
          </div>
        ))}
      </div>

      {dosen.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada dosen</h3>
          <p className="text-gray-500">Tambahkan dosen pertama Anda untuk memulai</p>
        </div>
      )}

      {showRekamModal && (
        <RekamSuaraModal
          dosen={selectedDosen}
          onClose={() => setShowRekamModal(false)}
          onSuccess={() => {
            setShowRekamModal(false);
            onUpdate();
          }}
        />
      )}
    </>
  );
}