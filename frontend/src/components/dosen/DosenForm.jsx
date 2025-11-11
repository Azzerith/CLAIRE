import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Circle, Upload, Volume2, ChevronDown, ChevronUp, Check, CheckCircle, User, Award } from 'lucide-react';
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
  const [completedLines, setCompletedLines] = useState(new Set());
  const [showScript, setShowScript] = useState(true);
  const [currentFocusedLine, setCurrentFocusedLine] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const scriptContainerRef = useRef(null);
  const lineRefs = useRef([]);

  // Script panduan rekaman
  const recordingScript = [
    "Selamat pagi, nama saya [NAMA LENGKAP DOSEN]. Saya akan merekam sample suara untuk sistem pengenalan pembicara.",
    "Sekarang hari [TANGGAL SEKARANG] dan rekaman ini akan digunakan untuk meningkatkan akurasi identifikasi dalam proses monitoring pembelajaran.",
    "Dalam era digital seperti sekarang, teknologi artificial intelligence telah membawa banyak perubahan signifikan di berbagai bidang, termasuk pendidikan.",
    "Sistem pengenalan suara atau speaker recognition memanfaatkan karakteristik vokal yang unik dari setiap individu untuk melakukan identifikasi.",
    "Pendidikan tinggi menghadapi tantangan transformasi digital yang membutuhkan adaptasi cepat dari seluruh sivitas akademika.",
    "Inovasi dalam teknologi pembelajaran tidak hanya tentang alat, tetapi juga tentang metodologi dan pendekatan yang lebih efektif.",
    "Big data analytics dan machine learning menjadi komponen penting dalam menganalisis efektivitas proses belajar mengajar."
  ];

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!isRecording) return;
      
      if (event.key === 'Enter') {
        event.preventDefault();
        handleEnterKey();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setCurrentFocusedLine(prev => Math.min(prev + 1, recordingScript.length - 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setCurrentFocusedLine(prev => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isRecording, currentFocusedLine, completedLines]);

  // Auto-scroll to focused line
  useEffect(() => {
    if (lineRefs.current[currentFocusedLine] && scriptContainerRef.current) {
      lineRefs.current[currentFocusedLine].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentFocusedLine]);

  const handleEnterKey = () => {
    if (!isRecording) return;
    
    const newCompletedLines = new Set(completedLines);
    
    if (newCompletedLines.has(currentFocusedLine)) {
      newCompletedLines.delete(currentFocusedLine);
    } else {
      newCompletedLines.add(currentFocusedLine);
      
      let nextLine = currentFocusedLine + 1;
      while (nextLine < recordingScript.length && newCompletedLines.has(nextLine)) {
        nextLine++;
      }
      
      if (nextLine < recordingScript.length) {
        setCurrentFocusedLine(nextLine);
      }
    }
    
    setCompletedLines(newCompletedLines);
  };

  const toggleLineCompletion = (lineIndex) => {
    const newCompletedLines = new Set(completedLines);
    if (newCompletedLines.has(lineIndex)) {
      newCompletedLines.delete(lineIndex);
    } else {
      newCompletedLines.add(lineIndex);
      
      let nextLine = lineIndex + 1;
      while (nextLine < recordingScript.length && newCompletedLines.has(nextLine)) {
        nextLine++;
      }
      
      if (nextLine < recordingScript.length) {
        setCurrentFocusedLine(nextLine);
      }
    }
    setCompletedLines(newCompletedLines);
  };

  const startRecording = async () => {
    try {
      setError('');
      setAudioBlob(null);
      setRecordingTime(0);
      setRecordingDuration(0);
      setCompletedLines(new Set());
      setCurrentFocusedLine(0);

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
        
        convertToWav(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingTime(elapsed);
        
        if (elapsed >= 70) {
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
    setCompletedLines(new Set());
    setCurrentFocusedLine(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const replacePlaceholders = (text) => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return text
      .replace('[NAMA LENGKAP DOSEN]', formData.nama || '[Nama Dosen]')
      .replace('[TANGGAL SEKARANG]', formattedDate);
  };

  const progressPercentage = recordingScript.length > 0 
    ? (completedLines.size / recordingScript.length) * 100 
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl">
          <div className="flex items-center">
            <div className="shrink-0">
              <Circle className="h-4 w-4" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Data Dosen */}
      <div className="bg-linear-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <User className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-indigo-800">Data Dosen</h3>
            <p className="text-indigo-600 text-sm">Informasi dasar dosen</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-indigo-700 mb-2">
              Nama Dosen *
            </label>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full px-4 py-3 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
              placeholder="Masukkan nama lengkap dosen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-indigo-700 mb-2">
              Gelar Akademik
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.gelar}
                onChange={(e) => setFormData({ ...formData, gelar: e.target.value })}
                className="w-full px-4 py-3 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                placeholder="Contoh: S.T., M.T., Ph.D."
              />
              <Award className="absolute right-3 top-3 h-5 w-5 text-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Rekaman Sample Suara */}
      <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
        <div className="bg-linear-to-r from-indigo-500 to-purple-400 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Mic className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Sample Suara</h3>
                <p className="text-indigo-100 text-sm">
                  Rekam sample suara untuk sistem recognition CLAIRE
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowScript(!showScript)}
              className="text-indigo-100 hover:text-white flex items-center space-x-1 transition-colors duration-200"
            >
              {showScript ? (
                <>
                  <span className="text-sm">Sembunyikan Script</span>
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span className="text-sm">Tampilkan Script</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Script Panel */}
          {showScript && (
            <div className="lg:w-1/2 border-r border-indigo-100">
              <div className="p-4 bg-indigo-50 border-b border-indigo-100">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-indigo-800">Script Panduan</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-indigo-600 font-medium">
                      {completedLines.size} / {recordingScript.length} selesai
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-indigo-200 rounded-full h-2">
                    <div 
                      className="bg-linear-to-r from-emerald-500 to-green-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Keyboard Instructions */}
                {isRecording && (
                  <div className="mt-3 flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-lg border border-indigo-200">
                      <kbd className="px-1.5 py-0.5 text-xs font-semibold text-indigo-700 bg-indigo-100 border border-indigo-300 rounded">Enter</kbd>
                      <span className="text-indigo-700">Ceklis line</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-lg border border-indigo-200">
                      <kbd className="px-1.5 py-0.5 text-xs font-semibold text-indigo-700 bg-indigo-100 border border-indigo-300 rounded">↑↓</kbd>
                      <span className="text-indigo-700">Navigasi</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div 
                ref={scriptContainerRef}
                className="h-80 overflow-y-auto p-4 bg-linear-to-b from-white to-indigo-25"
              >
                <div className="space-y-3">
                  {recordingScript.map((line, index) => (
                    <div
                      key={index}
                      id={`line-${index}`}
                      ref={el => lineRefs.current[index] = el}
                      className={`p-4 rounded-xl transition-all duration-300 cursor-pointer border-2 ${
                        completedLines.has(index)
                          ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                          : currentFocusedLine === index && isRecording
                          ? 'bg-linear-to-r from-indigo-50 to-blue-50 border-indigo-300 shadow-md'
                          : 'bg-white border-indigo-100 hover:border-indigo-200'
                      }`}
                      onClick={() => isRecording && (setCurrentFocusedLine(index), toggleLineCompletion(index))}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Checkbox */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                          completedLines.has(index)
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : currentFocusedLine === index && isRecording
                            ? 'bg-indigo-500 text-white shadow-sm'
                            : 'bg-indigo-100 text-indigo-400 group-hover:bg-indigo-200'
                        }`}>
                          {completedLines.has(index) ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <div className={`w-2 h-2 rounded-full ${
                              currentFocusedLine === index && isRecording ? 'bg-white' : 'bg-indigo-400'
                            }`} />
                          )}
                        </div>
                        
                        {/* Line Number */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                          currentFocusedLine === index && isRecording
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {index + 1}
                        </div>
                        
                        {/* Text */}
                        <p className="text-sm text-gray-700 leading-relaxed flex-1">
                          {replacePlaceholders(line)}
                        </p>
                      </div>
                      
                      {/* Instruction */}
                      {isRecording && !completedLines.has(index) && (
                        <div className="mt-2 flex items-center space-x-2 text-xs text-indigo-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>
                            {currentFocusedLine === index 
                              ? "Tekan Enter untuk ceklis →" 
                              : "Klik atau gunakan keyboard"
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Controls Panel */}
          <div className={`${showScript ? 'lg:w-1/2' : 'w-full'} p-6`}>
            <div className="space-y-6">
              {/* Recording Controls */}
              <div className="flex flex-col items-center space-y-6">
                {!isRecording && !audioBlob && (
                  <div className="text-center py-6">
                    <div className="w-20 h-20 bg-linear-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-4 mx-auto shadow-sm">
                      <Mic className="h-8 w-8 text-indigo-600" />
                    </div>
                    <p className="text-gray-600 mb-4 max-w-sm">
                      Klik tombol di bawah untuk mulai merekam sample suara dosen
                    </p>
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={!formData.nama}
                      className="bg-linear-to-r from-indigo-500 to-purple-400 hover:from-indigo-600 hover:to-purple-500 text-white font-semibold py-3 px-6 rounded-xl flex items-center space-x-2 mx-auto transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Mic className="h-5 w-5" />
                      <span>Mulai Rekam</span>
                    </button>
                    {!formData.nama && (
                      <p className="text-sm text-rose-500 mt-3">
                        Isi nama dosen terlebih dahulu
                      </p>
                    )}
                  </div>
                )}

                {isRecording && (
                  <div className="text-center py-6 w-full">
                    <div className="w-20 h-20 bg-linear-to-br from-rose-100 to-red-100 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse shadow-sm">
                      <Circle className="h-8 w-8 text-rose-600 fill-rose-600" />
                    </div>
                    <div className="text-2xl font-mono font-bold text-rose-600 mb-3">
                      {formatTime(recordingTime)}
                    </div>
                    <p className="text-gray-600 mb-3 font-semibold">Sedang merekam...</p>
                    
                    {/* Progress Indicator */}
                    <div className="bg-indigo-50 rounded-xl p-4 mb-4 border border-indigo-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-indigo-800">Progress Script</span>
                        <span className="text-sm text-indigo-600 font-medium">
                          {completedLines.size} / {recordingScript.length} selesai
                        </span>
                      </div>
                      <div className="w-full bg-indigo-200 rounded-full h-2">
                        <div 
                          className="bg-linear-to-r from-indigo-500 to-purple-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Current Focus Info */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
                      <div className="text-sm text-emerald-700">
                        <strong>Line aktif:</strong> {currentFocusedLine + 1}. {recordingScript[currentFocusedLine].substring(0, 60)}...
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={stopRecording}
                      className="bg-linear-to-r from-rose-500 to-red-400 hover:from-rose-600 hover:to-red-500 text-white font-semibold py-3 px-6 rounded-xl flex items-center space-x-2 mx-auto transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Square className="h-5 w-5" />
                      <span>Stop Rekam</span>
                    </button>
                  </div>
                )}

                {audioBlob && !isRecording && (
                  <div className="space-y-4 w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-emerald-600 flex items-center">
                        <Volume2 className="h-4 w-4 mr-2" />
                        Rekaman selesai ({formatTime(recordingDuration)})
                      </span>
                      <button
                        type="button"
                        onClick={handleRetryRecording}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
                      >
                        Rekam ulang
                      </button>
                    </div>
                    
                    <audio controls className="w-full rounded-lg">
                      <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                      Browser Anda tidak mendukung pemutar audio.
                    </audio>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-linear-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
                <h4 className="font-semibold text-amber-800 mb-3 text-sm">Panduan Rekaman:</h4>
                <ul className="text-sm text-amber-700 space-y-2">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    <span><strong>Baca natural</strong> dengan kecepatan sedang</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    <span><strong>Enter</strong> - Ceklis line saat ini</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    <span><strong>↑/↓</strong> - Navigasi antar line</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    <span><strong>Volume konsisten</strong> - tidak terlalu keras atau pelan</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    <span><strong>Target durasi</strong> sekitar 1 menit untuk hasil optimal</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 pt-4">
        <button
          type="submit"
          disabled={loading || isRecording}
          className="flex-1 bg-linear-to-r from-indigo-500 to-purple-400 hover:from-indigo-600 hover:to-purple-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Menyimpan...' : dosen ? 'Update Dosen' : 'Simpan Dosen'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading || isRecording}
          className="bg-white text-gray-700 hover:bg-gray-50 font-medium py-3 px-6 rounded-xl border border-gray-300 transition-all duration-200 hover:shadow-lg disabled:opacity-50"
        >
          Batal
        </button>
      </div>

      {/* Status Info */}
      {dosen?.path_sample_suara && !audioBlob && (
        <div className="bg-linear-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Volume2 className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-amber-800 font-medium">
                Dosen ini sudah memiliki sample suara
              </p>
              <p className="text-amber-700 text-sm">
                Rekam ulang untuk mengganti sample suara yang ada
              </p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}