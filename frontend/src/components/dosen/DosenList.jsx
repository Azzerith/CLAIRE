import { useState } from 'react';
import { Edit2, Trash2, Mic, Play,Users } from 'lucide-react';
import { dosenAPI } from '../../services/api';
import RekamSuaraModal from './RekamSuaraModal';

export default function DosenList({ dosen, onEdit, onUpdate }) {
  const [showRekamModal, setShowRekamModal] = useState(false);
  const [selectedDosen, setSelectedDosen] = useState(null);
  const [loading, setLoading] = useState(null);

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

  const playSampleSuara = (dosen) => {
    if (dosen.path_sample_suara) {
      const audioUrl = `http://localhost:8080/api/v1/audio/${dosen.path_sample_suara.split('/').pop()}`;
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dosen.map((d) => (
          <div key={d.id} className="card">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg text-gray-800">{d.nama}</h3>
                <p className="text-gray-600">{d.gelar}</p>
              </div>
              <div className="flex space-x-1">
                {d.path_sample_suara && (
                  <button
                    onClick={() => playSampleSuara(d)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Putar Sample Suara"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => handleRekamSuara(d)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Rekam Suara"
                >
                  <Mic className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onEdit(d)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(d.id)}
                  disabled={loading === d.id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              {d.path_sample_suara ? (
                <span className="text-green-600">✓ Sample suara tersedia</span>
              ) : (
                <span className="text-orange-600">✗ Belum ada sample suara</span>
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