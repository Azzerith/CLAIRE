import { useState, useEffect } from 'react';
import { jadwalAPI, dosenAPI } from '../../services/api';

export default function JadwalForm({ jadwal, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    nama_matkul: jadwal?.nama_matkul || '',
    dosen_id: jadwal?.dosen_id || '',
    waktu_mulai: jadwal?.waktu_mulai ? new Date(jadwal.waktu_mulai).toISOString().slice(0, 16) : '',
    waktu_selesai: jadwal?.waktu_selesai ? new Date(jadwal.waktu_selesai).toISOString().slice(0, 16) : '',
    ruangan: jadwal?.ruangan || '',
  });
  
  const [dosen, setDosen] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDosen = async () => {
      try {
        const response = await dosenAPI.getAll();
        setDosen(response.data);
      } catch (err) {
        setError('Gagal memuat data dosen');
      }
    };

    fetchDosen();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validasi waktu
    if (new Date(formData.waktu_selesai) <= new Date(formData.waktu_mulai)) {
      setError('Waktu selesai harus setelah waktu mulai');
      setLoading(false);
      return;
    }

    try {
      const jadwalData = {
        ...formData,
        waktu_mulai: new Date(formData.waktu_mulai).toISOString(),
        waktu_selesai: new Date(formData.waktu_selesai).toISOString(),
      };

      if (jadwal) {
        await jadwalAPI.update(jadwal.id, jadwalData);
      } else {
        await jadwalAPI.create(jadwalData);
      }

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
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
          Nama Mata Kuliah *
        </label>
        <input
          type="text"
          required
          value={formData.nama_matkul}
          onChange={(e) => setFormData({ ...formData, nama_matkul: e.target.value })}
          className="input-field"
          placeholder="Masukkan nama mata kuliah"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dosen Pengajar *
        </label>
        <select
          required
          value={formData.dosen_id}
          onChange={(e) => setFormData({ ...formData, dosen_id: e.target.value })}
          className="input-field"
        >
          <option value="">Pilih Dosen</option>
          {dosen.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nama} {d.gelar && `- ${d.gelar}`}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Waktu Mulai *
          </label>
          <input
            type="datetime-local"
            required
            value={formData.waktu_mulai}
            onChange={(e) => setFormData({ ...formData, waktu_mulai: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Waktu Selesai *
          </label>
          <input
            type="datetime-local"
            required
            value={formData.waktu_selesai}
            onChange={(e) => setFormData({ ...formData, waktu_selesai: e.target.value })}
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ruangan
        </label>
        <input
          type="text"
          value={formData.ruangan}
          onChange={(e) => setFormData({ ...formData, ruangan: e.target.value })}
          className="input-field"
          placeholder="Contoh: A101, Lab Komputer"
        />
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Menyimpan...' : jadwal ? 'Update Jadwal' : 'Buat Jadwal'}
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