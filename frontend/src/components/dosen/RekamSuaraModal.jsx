import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Circle, Upload, Volume2, ChevronDown, ChevronUp, Check, CheckCircle, X, User } from 'lucide-react';
import { dosenAPI, APP_CONFIG } from '../../services/api';

export default function RekamSuaraModal({ dosen, onClose, onSuccess }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
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
    "Hari ini tanggal [TANGGAL SEKARANG] dan rekaman ini akan digunakan untuk meningkatkan akurasi identifikasi dalam proses monitoring pembelajaran.",
    "Dalam era digital seperti sekarang, teknologi artificial intelligence telah membawa banyak perubahan signifikan di berbagai bidang, termasuk pendidikan.",
    "Sistem pengenalan suara atau speaker recognition memanfaatkan karakteristik vokal yang unik dari setiap individu untuk melakukan identifikasi.",
    "Pendidikan tinggi menghadapi tantangan transformasi digital yang membutuhkan adaptasi cepat dari seluruh sivitas akademika.",
    "Inovasi dalam teknologi pembelajaran tidak hanya tentang alat, tetapi juga tentang metodologi dan pendekatan yang lebih efektif.",
    "Big data analytics dan machine learning menjadi komponen penting dalam menganalisis efektivitas proses belajar mengajar.",
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
    setCompletedLines(new Set());
    setCurrentFocusedLine(0);
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
      .replace('[NAMA LENGKAP DOSEN]', dosen.nama)
      .replace('[TANGGAL SEKARANG]', formattedDate);
  };

  const progressPercentage = recordingScript.length > 0 
    ? (completedLines.size / recordingScript.length) * 100 
    : 0;

  return (
    <div className="fixed inset-0 backdrop-blur-sm drop-shadow-2xl bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-indigo-100">
        {/* Header */}
        <div className="bg-linear-to-r from-indigo-500 to-purple-400 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Mic className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Rekam Sample Suara
                </h2>
                <p className="text-indigo-100 text-sm">
                  {dosen.nama} - {dosen.gelar}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-xl transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border-b border-rose-200 text-rose-700 px-6 py-3">
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

        <div className="flex-1 overflow-hidden flex">
          {/* Script Panel */}
          {showScript && (
            <div className="w-1/2 border-r border-indigo-100 flex flex-col">
              <div className="flex justify-between items-center p-4 bg-indigo-50 border-b border-indigo-100">
                <h3 className="font-semibold text-indigo-800">Script Panduan</h3>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-indigo-600 font-medium">
                    {completedLines.size} / {recordingScript.length} selesai
                  </span>
                  <button
                    onClick={() => setShowScript(false)}
                    className="text-indigo-400 hover:text-indigo-600 transition-colors duration-200"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="px-4 py-3 bg-white border-b border-indigo-100">
                <div className="w-full bg-indigo-200 rounded-full h-2">
                  <div 
                    className="bg-linear-to-r from-emerald-500 to-green-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Keyboard Instructions */}
              {isRecording && (
                <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-lg border border-blue-200">
                      <kbd className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 border border-blue-300 rounded">Enter</kbd>
                      <span className="text-blue-700">Ceklis line</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-lg border border-blue-200">
                      <kbd className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 border border-blue-300 rounded">↑↓</kbd>
                      <span className="text-blue-700">Navigasi</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div 
                ref={scriptContainerRef}
                className="flex-1 overflow-y-auto p-4 bg-linear-to-b from-white to-indigo-25"
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
          <div className={`${showScript ? 'w-1/2' : 'w-full'} flex flex-col`}>
            <div className="flex justify-between items-center p-4 bg-indigo-50 border-b border-indigo-100">
              <h3 className="font-semibold text-indigo-800">Kontrol Rekaman</h3>
              {!showScript && (
                <button
                  onClick={() => setShowScript(true)}
                  className="text-indigo-400 hover:text-indigo-600 transition-colors duration-200"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-linear-to-b from-white to-blue-25">
              <div className="space-y-8">
                {/* Recording Controls */}
                <div className="flex flex-col items-center space-y-6">
                  {!isRecording && !audioBlob && (
                    <div className="text-center py-8">
                      <div className="w-28 h-28 bg-linear-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                        <Mic className="h-12 w-12 text-indigo-600" />
                      </div>
                      <p className="text-gray-700 mb-3 text-xl font-semibold">
                        Siap untuk merekam sample suara
                      </p>
                      <p className="text-gray-600 mb-8 max-w-md text-lg leading-relaxed">
                        Baca script panduan yang tersedia. Rekaman akan berdurasi sekitar 1 menit untuk hasil recognition yang optimal.
                      </p>
                      <button
                        onClick={startRecording}
                        className="bg-linear-to-r from-indigo-500 to-purple-400 hover:from-indigo-600 hover:to-purple-500 text-white font-semibold text-lg py-4 px-10 rounded-xl flex items-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Mic className="h-6 w-6" />
                        <span>Mulai Rekam</span>
                      </button>
                    </div>
                  )}

                  {isRecording && (
                    <div className="text-center py-8 w-full">
                      <div className="w-24 h-24 bg-linear-to-br from-rose-100 to-red-100 rounded-full flex items-center justify-center mb-6 mx-auto animate-pulse shadow-lg">
                        <Circle className="h-10 w-10 text-rose-600 fill-rose-600" />
                      </div>
                      <div className="text-4xl font-mono font-bold text-rose-600 mb-4">
                        {formatTime(recordingTime)}
                      </div>
                      <p className="text-gray-700 mb-4 font-semibold text-lg">Sedang merekam...</p>
                      
                      {/* Progress Indicator */}
                      <div className="bg-indigo-50 rounded-xl p-4 mb-4 border border-indigo-100 max-w-md mx-auto">
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
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 max-w-md mx-auto">
                        <div className="text-sm text-emerald-700 font-medium">
                          <strong>Line aktif:</strong> {currentFocusedLine + 1}. {recordingScript[currentFocusedLine].substring(0, 60)}...
                        </div>
                      </div>

                      <button
                        onClick={stopRecording}
                        className="bg-linear-to-r from-rose-500 to-red-400 hover:from-rose-600 hover:to-red-500 text-white font-semibold text-lg py-4 px-8 rounded-xl flex items-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Square className="h-5 w-5" />
                        <span>Stop Rekam</span>
                      </button>
                    </div>
                  )}

                  {audioBlob && !isRecording && (
                    <div className="text-center w-full">
                      <div className="w-24 h-24 bg-linear-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                        <Volume2 className="h-10 w-10 text-emerald-600" />
                      </div>
                      <p className="text-gray-700 mb-2 text-xl font-semibold">
                        Rekaman selesai! ({formatTime(recordingDuration)})
                      </p>
                      <p className="text-emerald-600 mb-6 text-lg font-medium">
                        ✓ Sample suara berhasil direkam
                      </p>
                      
                      <div className="space-y-6 w-full max-w-md mx-auto">
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-3">Preview rekaman:</p>
                          <audio controls className="w-full rounded-lg shadow-sm">
                            <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                            Browser Anda tidak mendukung pemutar audio.
                          </audio>
                        </div>
                        
                        <div className="flex space-x-4">
                          <button
                            onClick={handleUpload}
                            disabled={loading}
                            className="flex-1 bg-linear-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-500 text-white font-semibold py-4 px-6 rounded-xl flex items-center space-x-3 justify-center transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Upload className="h-5 w-5" />
                            <span>{loading ? 'Mengupload...' : 'Simpan Sample'}</span>
                          </button>
                          
                          <button
                            onClick={handleRetry}
                            disabled={loading}
                            className="bg-white text-gray-700 hover:bg-gray-50 font-medium py-4 px-6 rounded-xl border border-gray-300 flex items-center space-x-2 transition-all duration-200 hover:shadow-lg disabled:opacity-50"
                          >
                            <span>Rekam Ulang</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="bg-linear-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-5">
                  <h4 className="font-semibold text-amber-800 mb-3 text-lg">Panduan Rekaman:</h4>
                  <ul className="text-amber-700 space-y-2 text-sm">
                    <li className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span><strong>Baca natural</strong> dengan kecepatan sedang dan artikulasi jelas</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span><strong>Enter</strong> - Ceklis line saat ini setelah selesai membaca</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span><strong>↑/↓</strong> - Navigasi antar line script</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span><strong>Volume konsisten</strong> - jaga jarak dengan mikrofon tetap sama</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span><strong>Target durasi</strong> sekitar 1 menit untuk coverage vokal yang optimal</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}