import { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, User, MapPin, Loader } from 'lucide-react';
import { jadwalAPI, dosenAPI } from '../../services/api';

export default function JadwalForm({ jadwal, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    nama_matkul: jadwal?.nama_matkul || '',
    dosen_id: jadwal?.dosen_id || '',
    hari: jadwal?.hari || '',
    waktu_mulai: jadwal?.waktu_mulai || '',
    waktu_selesai: jadwal?.waktu_selesai || '',
    ruangan: jadwal?.ruangan || '',
  });
  
  const [dosen, setDosen] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');

  // Daftar hari
  const hariOptions = [
    { value: 'SENIN', label: 'Senin' },
    { value: 'SELASA', label: 'Selasa' },
    { value: 'RABU', label: 'Rabu' },
    { value: 'KAMIS', label: 'Kamis' },
    { value: 'JUMAT', label: 'Jumat' },
    { value: 'SABTU', label: 'Sabtu' },
    { value: 'MINGGU', label: 'Minggu' },
  ];

  useEffect(() => {
    const fetchDosen = async () => {
      try {
        const response = await dosenAPI.getAll();
        setDosen(response.data);
      } catch (err) {
        setError('Gagal memuat data dosen');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchDosen();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validasi field required
    if (!formData.hari) {
      setError('Hari harus dipilih');
      setLoading(false);
      return;
    }

    // Validasi waktu
    if (!formData.waktu_mulai || !formData.waktu_selesai) {
      setError('Waktu mulai dan selesai harus diisi');
      setLoading(false);
      return;
    }

    if (formData.waktu_selesai <= formData.waktu_mulai) {
      setError('Waktu selesai harus setelah waktu mulai');
      setLoading(false);
      return;
    }

    try {
      const jadwalData = {
        ...formData,
        // Tidak perlu konversi waktu karena sekarang hanya format HH:MM
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg flex items-start space-x-3">
          <div className="shrink-0 mt-0.5">
            <div className="w-5 h-5 bg-rose-100 rounded-full flex items-center justify-center">
              <span className="text-rose-500 text-sm font-bold">!</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Mata Kuliah Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Nama Mata Kuliah *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <BookOpen className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            required
            value={formData.nama_matkul}
            onChange={(e) => setFormData({ ...formData, nama_matkul: e.target.value })}
            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
            placeholder="Masukkan nama mata kuliah"
          />
        </div>
      </div>

      {/* Dosen Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Dosen Pengajar *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          {fetchLoading ? (
            <div className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 items-center">
              <Loader className="h-4 w-4 animate-spin text-gray-400 mr-2" />
              <span className="text-gray-500">Memuat data dosen...</span>
            </div>
          ) : (
            <select
              required
              value={formData.dosen_id}
              onChange={(e) => setFormData({ ...formData, dosen_id: e.target.value })}
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white"
            >
              <option value="">Pilih Dosen Pengajar</option>
              {dosen.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nama} {d.gelar && `- ${d.gelar}`}
                </option>
              ))}
            </select>
          )}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="w-2 h-2 border-r-2 border-b-2 border-gray-400 transform rotate-45 -translate-y-1"></div>
          </div>
        </div>
      </div>

      {/* Hari Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Hari *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <select
            required
            value={formData.hari}
            onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white"
          >
            <option value="">Pilih Hari</option>
            {hariOptions.map((hari) => (
              <option key={hari.value} value={hari.value}>
                {hari.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="w-2 h-2 border-r-2 border-b-2 border-gray-400 transform rotate-45 -translate-y-1"></div>
          </div>
        </div>
      </div>

      {/* Waktu Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Waktu Mulai *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="time"
              required
              value={formData.waktu_mulai}
              onChange={(e) => setFormData({ ...formData, waktu_mulai: e.target.value })}
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Waktu Selesai *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="time"
              required
              value={formData.waktu_selesai}
              onChange={(e) => setFormData({ ...formData, waktu_selesai: e.target.value })}
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              min={formData.waktu_mulai}
            />
          </div>
        </div>
      </div>

      {/* Ruangan Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Ruangan
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={formData.ruangan}
            onChange={(e) => setFormData({ ...formData, ruangan: e.target.value })}
            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
            placeholder="Contoh: Lab 1, Lab 2, dst..."
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Opsional - kosongkan jika tidak menggunakan ruangan tertentu
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading || fetchLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <span>{jadwal ? 'Update Jadwal' : 'Buat Jadwal'}</span>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed border border-gray-300"
        >
          Batal
        </button>
      </div>

      {/* Form Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <div className="shrink-0 mt-0.5">
            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-500 text-sm font-bold">i</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-blue-700 font-medium">Tips Pengisian Jadwal</p>
            <ul className="text-xs text-blue-600 mt-1 space-y-1">
              <li>• Pastikan waktu selesai setelah waktu mulai</li>
              <li>• Pilih dosen yang sudah memiliki sample suara untuk monitoring optimal</li>
              <li>• Sistem akan otomatis memonitoring berdasarkan jadwal yang ditentukan</li>
              <li>• Format waktu menggunakan 24 jam (contoh: 13:30 untuk jam 1:30 siang)</li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
}