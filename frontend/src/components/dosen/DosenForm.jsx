import { useState } from 'react';
import { dosenAPI, APP_CONFIG } from '../../services/api';

export default function DosenForm({ dosen, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    nama: dosen?.nama || '',
    gelar: dosen?.gelar || '',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nama', formData.nama);
      formDataToSend.append('gelar', formData.gelar);
      
      if (file) {
        formDataToSend.append('sample_suara', file);
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      // Validasi tipe file
      if (selectedFile.type !== 'audio/wav') {
        setError('Hanya file .wav yang diizinkan');
        return;
      }
      
      // Validasi size file dari .env
      if (selectedFile.size > APP_CONFIG.UPLOAD_MAX_SIZE) {
        setError(`File terlalu besar. Maksimal ${APP_CONFIG.UPLOAD_MAX_SIZE / 1024 / 1024}MB`);
        return;
      }
    }
    
    setFile(selectedFile);
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sample Suara {!dosen && '(Opsional)'}
        </label>
        <input
          type="file"
          accept=".wav"
          onChange={handleFileChange}
          className="input-field"
        />
        <p className="text-xs text-gray-500 mt-1">
          Format: .wav, Maksimal: {APP_CONFIG.UPLOAD_MAX_SIZE / 1024 / 1024}MB
        </p>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Menyimpan...' : dosen ? 'Update' : 'Simpan'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Batal
        </button>
      </div>
    </form>
  );
}