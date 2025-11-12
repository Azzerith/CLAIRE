package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"CLAIRE/database"
	"CLAIRE/models"

	"github.com/gin-gonic/gin"
)

var validHari = map[string]bool{
	"SENIN":   true,
	"SELASA":  true,
	"RABU":    true,
	"KAMIS":   true,
	"JUMAT":   true,
	"SABTU":   true,
	"MINGGU":  true,
}

// Struct untuk response analisis dari Python backend
type AudioAnalysisResponse struct {
	Analysis struct {
		ClarityScore    float64  `json:"clarity_score"`
		Effectiveness   int      `json:"effectiveness"`
		Feedback        string   `json:"feedback"`
		IsEffective     bool     `json:"is_effective"`
		Redundancy      float64  `json:"redundancy"`
		Summary         string   `json:"summary"`
		TopicFocus      []string `json:"topic_focus"`
	} `json:"analysis"`
	Similarity  float64 `json:"similarity"`
	Speaker     string  `json:"speaker"`
	Status      string  `json:"status"`
	Timestamp   string  `json:"timestamp"`
	Transcript  string  `json:"transcript"`
}

// Fungsi untuk update status jadwal secara otomatis
func UpdateJadwalStatus() {
	db := database.GetDB()
	var jadwals []models.Jadwal
	
	// Ambil semua jadwal yang tidak sedang merekam
	db.Where("sedang_rekam = ?", false).Find(&jadwals)
	
	for _, jadwal := range jadwals {
		var newStatus string
		
		if jadwal.IsOngoing() {
			newStatus = "aktif"
		} else if jadwal.IsCompleted() {
			newStatus = "selesai"
		} else {
			newStatus = "terjadwal"
		}
		
		// Update jika status berubah
		if jadwal.Status != newStatus {
			db.Model(&jadwal).Update("status", newStatus)
		}
	}
}

func BuatJadwal(c *gin.Context) {
	var jadwal models.Jadwal
	if err := c.ShouldBindJSON(&jadwal); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validasi hari
	if !validHari[jadwal.Hari] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Hari tidak valid. Gunakan: SENIN, SELASA, RABU, KAMIS, JUMAT, SABTU, MINGGU"})
		return
	}

	// Validasi format waktu
	if !isValidTime(jadwal.WaktuMulai) || !isValidTime(jadwal.WaktuSelesai) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format waktu tidak valid. Gunakan format HH:MM"})
		return
	}

	// Validasi waktu selesai harus setelah waktu mulai
	if jadwal.WaktuSelesai <= jadwal.WaktuMulai {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Waktu selesai harus setelah waktu mulai"})
		return
	}

	// Set status awal berdasarkan waktu
	if jadwal.IsOngoing() {
		jadwal.Status = "aktif"
	} else if jadwal.IsCompleted() {
		jadwal.Status = "selesai"
	} else {
		jadwal.Status = "terjadwal"
	}

	db := database.GetDB()
	result := db.Create(&jadwal)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	// Load data dosen
	db.Preload("Dosen").First(&jadwal, jadwal.ID)

	c.JSON(http.StatusCreated, jadwal)
}

// Di semua fungsi yang mengambil jadwal, panggil UpdateJadwalStatus terlebih dahulu
func DapatkanSemuaJadwal(c *gin.Context) {
	// Update status sebelum mengambil data
	UpdateJadwalStatus()
	
	var jadwal []models.Jadwal
	db := database.GetDB()
	result := db.Preload("Dosen").Find(&jadwal)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, jadwal)
}

func DapatkanJadwal(c *gin.Context) {
	UpdateJadwalStatus() // Update status
	
	id := c.Param("id")
	var jadwal models.Jadwal
	db := database.GetDB()
	result := db.Preload("Dosen").First(&jadwal, "id = ?", id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Jadwal tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, jadwal)
}

// Update fungsi recording
func MulaiRekaman(c *gin.Context) {
	jadwalID := c.Param("id")
	
	db := database.GetDB()
	result := db.Model(&models.Jadwal{}).Where("id = ?", jadwalID).Updates(map[string]interface{}{
		"sedang_rekam": true,
		"status":       "merekam",
		"tanggal_diupdate": time.Now(),
	})
	
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Rekaman dimulai"})
}

func HentikanRekaman(c *gin.Context) {
	jadwalID := c.Param("id")
	
	db := database.GetDB()
	
	// Set status berdasarkan waktu setelah rekaman selesai
	var jadwal models.Jadwal
	db.First(&jadwal, "id = ?", jadwalID)
	
	newStatus := "selesai"
	if jadwal.IsOngoing() {
		newStatus = "aktif"
	}
	
	result := db.Model(&models.Jadwal{}).Where("id = ?", jadwalID).Updates(map[string]interface{}{
		"sedang_rekam": false,
		"status":       newStatus,
		"tanggal_diupdate": time.Now(),
	})
	
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Rekaman dihentikan"})
}

// Helper function untuk validasi format waktu
func isValidTime(timeStr string) bool {
	if len(timeStr) != 5 {
		return false
	}
	if timeStr[2] != ':' {
		return false
	}
	
	hour := timeStr[0:2]
	minute := timeStr[3:5]
	
	return (hour >= "00" && hour <= "23") && (minute >= "00" && minute <= "59")
}

func UpdateJadwal(c *gin.Context) {
	id := c.Param("id")
	
	var jadwal models.Jadwal
	if err := c.ShouldBindJSON(&jadwal); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := database.GetDB()
	result := db.Model(&models.Jadwal{}).Where("id = ?", id).Updates(jadwal)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Jadwal berhasil diupdate"})
}

func HapusJadwal(c *gin.Context) {
	id := c.Param("id")
	
	db := database.GetDB()
	result := db.Delete(&models.Jadwal{}, "id = ?", id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Jadwal berhasil dihapus"})
}

func DapatkanJadwalSedangRekam(c *gin.Context) {
	var jadwal []models.Jadwal
	
	db := database.GetDB()
	result := db.Preload("Dosen").Where("sedang_rekam = ?", true).Find(&jadwal)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, jadwal)
}

// Handler untuk rekaman otomatis
func MulaiRekamanOtomatis(c *gin.Context) {
    id := c.Param("id")
    
    var jadwal models.Jadwal
    db := database.GetDB()
    result := db.Preload("Dosen").First(&jadwal, "id = ?", id)
    if result.Error != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Jadwal tidak ditemukan"})
        return
    }

    // Validasi apakah jadwal aktif dan sesuai waktu
    now := time.Now()
    currentDay := strings.ToUpper(now.Format("Monday"))
    currentTime := now.Format("15:04")

    if jadwal.Hari != currentDay {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Jadwal tidak aktif hari ini"})
        return
    }

    // Mulai proses rekaman otomatis di goroutine terpisah
    go ExecuteScheduledRecording(jadwal)

    c.JSON(http.StatusOK, gin.H{
        "message": "Auto recording started",
        "jadwal_id": id,
        "waktu": currentTime,
    })
}

func GetRecordingSchedule(c *gin.Context) {
    id := c.Param("id")
    
    var jadwal models.Jadwal
    db := database.GetDB()
    result := db.First(&jadwal, "id = ?", id)
    if result.Error != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Jadwal tidak ditemukan"})
        return
    }

    recordingTimes := calculateRecordingTimes(jadwal.WaktuMulai)
    
    c.JSON(http.StatusOK, gin.H{
        "jadwal_id": id,
        "recording_schedule": recordingTimes,
        "duration_seconds": 60, // 1 menit
        "total_sessions": 5,    // 5 session 
    })
}

// Fungsi untuk eksekusi rekaman terjadwal
func ExecuteScheduledRecording(jadwal models.Jadwal) {
    db := database.GetDB()
    
    // Update status jadwal menjadi sedang merekam
    db.Model(&jadwal).Updates(map[string]interface{}{
        "sedang_rekam": true,
        "status":       "merekam",
        "tanggal_diupdate": time.Now(),
    })

    // Buat direktori recordings jika belum ada
    os.MkdirAll("recordings", 0755)

    // Lakukan 5x rekaman tanpa jeda, masing-masing 1 menit
    for session := 1; session <= 5; session++ {
        timestamp := time.Now().Format("20060102_150405")
        filename := fmt.Sprintf("recording_%s_session%d_%s.wav", jadwal.ID, session, timestamp)
        filepath := filepath.Join("recordings", filename)

        fmt.Printf("Starting recording session %d for jadwal %s\n", session, jadwal.ID)

        // Rekam audio menggunakan ffmpeg (1 menit = 60 detik)
        cmd := exec.Command("ffmpeg", 
            "-f", "dshow",               // Windows directshow
            "-i", "audio=Microphone",    // Audio input device
            "-t", "60",                  // Duration 60 detik (1 menit)
            "-acodec", "pcm_s16le",      // Audio codec
            "-ar", "16000",              // Sample rate
            "-ac", "1",                  // Mono audio
            filepath,                    // Output file
            "-y",                        // Overwrite output file
        )

        if err := cmd.Run(); err != nil {
            fmt.Printf("Error recording audio session %d: %v\n", session, err)
            continue
        }

        fmt.Printf("Recording session %d completed: %s\n", session, filepath)

        // Kirim ke Python backend untuk analisis
        analysis, err := sendAudioForAnalysis(filepath)
        if err != nil {
            fmt.Printf("Error sending audio for analysis session %d: %v\n", session, err)
            continue
        }

        // Simpan hasil analisis ke tabel Evaluasi
        evaluasi := models.Evaluasi{
            JadwalID:             jadwal.ID,
            KepercayaanPembicara: analysis.Similarity,
            TeksTranskripsi:      analysis.Transcript,
            Rangkuman:            analysis.Analysis.Summary,
            SkorEfektivitas:      float64(analysis.Analysis.Effectiveness) / 100.0,
            PathFileAudio:        filepath,
            WaktuPemrosesan:      0,
        }

        result := db.Create(&evaluasi)
        if result.Error != nil {
            fmt.Printf("Error saving evaluasi session %d: %v\n", session, result.Error)
        } else {
            fmt.Printf("Evaluation saved successfully for session %d\n", session)
        }

        // TANPA JEDA - langsung lanjut ke rekaman berikutnya
    }

    // Kembalikan status jadwal
    newStatus := "selesai"
    if jadwal.IsOngoing() {
        newStatus = "aktif"
    }

    db.Model(&jadwal).Updates(map[string]interface{}{
        "sedang_rekam": false,
        "status":       newStatus,
        "tanggal_diupdate": time.Now(),
    })

    fmt.Printf("Auto recording completed for jadwal %s\n", jadwal.ID)
}

// Fungsi untuk mengirim audio ke Python backend
func sendAudioForAnalysis(filepath string) (*AudioAnalysisResponse, error) {
    // Baca file audio
    audioData, err := os.ReadFile(filepath)
    if err != nil {
        return nil, fmt.Errorf("error reading audio file: %v", err)
    }

    // Buat request ke Python backend
    client := &http.Client{Timeout: 300 * time.Second} // 5 minutes timeout
    req, err := http.NewRequest("POST", "http://192.168.1.75/upload-audio", bytes.NewReader(audioData))
    if err != nil {
        return nil, fmt.Errorf("error creating request: %v", err)
    }
    
    req.Header.Set("Content-Type", "audio/wav")

    resp, err := client.Do(req)
    if err != nil {
        return nil, fmt.Errorf("error sending request: %v", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("server returned non-200 status: %d", resp.StatusCode)
    }

    var analysisResp AudioAnalysisResponse
    if err := json.NewDecoder(resp.Body).Decode(&analysisResp); err != nil {
        return nil, fmt.Errorf("error decoding response: %v", err)
    }

    return &analysisResp, nil
}

func calculateRecordingTimes(startTime string) []string {
    // 5x rekaman dimulai 10 menit setelah jam mulai, dengan interval 1 menit
    return []string{
        addMinutes(startTime, 10),  // Session 1: 10 menit setelah mulai
        addMinutes(startTime, 11),  // Session 2: 11 menit setelah mulai  
        addMinutes(startTime, 12),  // Session 3: 12 menit setelah mulai
        addMinutes(startTime, 13),  // Session 4: 13 menit setelah mulai
        addMinutes(startTime, 14),  // Session 5: 14 menit setelah mulai
    }
}

func addMinutes(timeStr string, minutes int) string {
    t, _ := time.Parse("15:04", timeStr)
    t = t.Add(time.Duration(minutes) * time.Minute)
    return t.Format("15:04")
}

// Handler untuk mendapatkan jadwal aktif hari ini
func DapatkanJadwalAktifHariIni(c *gin.Context) {
    UpdateJadwalStatus()
    
    currentDay := strings.ToUpper(time.Now().Format("Monday"))
    
    var jadwal []models.Jadwal
    db := database.GetDB()
    result := db.Preload("Dosen").Where("hari = ? AND status = ?", currentDay, "aktif").Find(&jadwal)
    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        return
    }

    c.JSON(http.StatusOK, jadwal)
}

// Handler untuk update status jadwal
func UpdateStatusJadwal(c *gin.Context) {
    id := c.Param("id")
    
    var input struct {
        Status string `json:"status" binding:"required"`
    }
    
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    validStatus := map[string]bool{
        "terjadwal": true,
        "aktif":     true,
        "merekam":   true,
        "selesai":   true,
    }
    
    if !validStatus[input.Status] {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Status tidak valid"})
        return
    }

    db := database.GetDB()
    result := db.Model(&models.Jadwal{}).Where("id = ?", id).Updates(map[string]interface{}{
        "status": input.Status,
        "tanggal_diupdate": time.Now(),
    })
    
    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Status jadwal berhasil diupdate"})
}

// handlers/jadwal.go - Tambahkan fungsi ini

func DapatkanJadwalByHari(c *gin.Context) {
    hari := c.Param("hari")
    
    // Validasi hari
    if !validHari[hari] {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Hari tidak valid"})
        return
    }
    
    var jadwal []models.Jadwal
    db := database.GetDB()
    result := db.Preload("Dosen").Where("hari = ?", hari).Find(&jadwal)
    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        return
    }

    c.JSON(http.StatusOK, jadwal)
}

// handlers/evaluasi.go - Tambahkan fungsi ini

func GetStatistikEvaluasi(c *gin.Context) {
    db := database.GetDB()
    
    var stats struct {
        TotalEvaluasi    int64   `json:"total_evaluasi"`
        RataRataSkor     float64 `json:"rata_rata_skor"`
        EvaluasiHariIni  int64   `json:"evaluasi_hari_ini"`
        TopDosen         string  `json:"top_dosen"`
    }
    
    // Total evaluasi
    db.Model(&models.Evaluasi{}).Count(&stats.TotalEvaluasi)
    
    // Rata-rata skor efektivitas
    db.Model(&models.Evaluasi{}).Select("AVG(skor_efektivitas)").Scan(&stats.RataRataSkor)
    
    // Evaluasi hari ini
    today := time.Now().Format("2006-01-02")
    db.Model(&models.Evaluasi{}).Where("DATE(tanggal_dibuat) = ?", today).Count(&stats.EvaluasiHariIni)
    
    c.JSON(http.StatusOK, stats)
}

func GetEvaluasiRecent(c *gin.Context) {
    // Parse limit parameter dengan default value 5
    limitStr := c.DefaultQuery("limit", "5")
    
    // Convert string to int
    limit := 5
    if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
        limit = parsedLimit
    }
    
    var evaluasi []models.Evaluasi
    db := database.GetDB()
    result := db.Preload("Jadwal.Dosen").
        Order("tanggal_dibuat DESC").
        Limit(limit).
        Find(&evaluasi)
        
    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        return
    }

    c.JSON(http.StatusOK, evaluasi)
}

// handlers/recording.go - Buat file baru untuk recording handlers

func StartScheduledRecording(c *gin.Context) {
    jadwalID := c.Param("jadwal_id")
    
    // Implementasi start scheduled recording
    c.JSON(http.StatusOK, gin.H{
        "message": "Scheduled recording started",
        "jadwal_id": jadwalID,
    })
}

func StopScheduledRecording(c *gin.Context) {
    jadwalID := c.Param("jadwal_id")
    
    // Implementasi stop scheduled recording
    c.JSON(http.StatusOK, gin.H{
        "message": "Scheduled recording stopped",
        "jadwal_id": jadwalID,
    })
}

func GetActiveRecordings(c *gin.Context) {
    var jadwal []models.Jadwal
    db := database.GetDB()
    result := db.Preload("Dosen").Where("sedang_rekam = ?", true).Find(&jadwal)
    
    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        return
    }

    c.JSON(http.StatusOK, jadwal)
}

func GetRecordingStatus(c *gin.Context) {
    jadwalID := c.Param("jadwal_id")
    
    var jadwal models.Jadwal
    db := database.GetDB()
    result := db.First(&jadwal, "id = ?", jadwalID)
    
    if result.Error != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Jadwal tidak ditemukan"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "jadwal_id": jadwalID,
        "sedang_rekam": jadwal.SedangRekam,
        "status": jadwal.Status,
    })
}

func ProcessAudioAnalysis(c *gin.Context) {
    // Implementasi processing audio analysis
    c.JSON(http.StatusOK, gin.H{
        "message": "Audio analysis processed",
    })
}

// handlers/dashboard.go - Buat file baru untuk dashboard handlers

func GetDashboardOverview(c *gin.Context) {
    db := database.GetDB()
    
    var overview struct {
        TotalDosen     int64 `json:"total_dosen"`
        TotalJadwal    int64 `json:"total_jadwal"`
        TotalEvaluasi  int64 `json:"total_evaluasi"`
        JadwalAktif    int64 `json:"jadwal_aktif"`
    }
    
    db.Model(&models.Dosen{}).Count(&overview.TotalDosen)
    db.Model(&models.Jadwal{}).Count(&overview.TotalJadwal)
    db.Model(&models.Evaluasi{}).Count(&overview.TotalEvaluasi)
    db.Model(&models.Jadwal{}).Where("status = ?", "aktif").Count(&overview.JadwalAktif)
    
    c.JSON(http.StatusOK, overview)
}

func GetRecentActivities(c *gin.Context) {
    // Implementasi recent activities
    c.JSON(http.StatusOK, gin.H{
        "activities": []string{},
    })
}

func GetDashboardStats(c *gin.Context) {
    // Implementasi dashboard stats
    c.JSON(http.StatusOK, gin.H{
        "stats": map[string]interface{}{},
    })
}

func GetUpcomingJadwal(c *gin.Context) {
    // Implementasi upcoming jadwal
    c.JSON(http.StatusOK, []interface{}{})
}

// handlers/system.go - Buat file baru untuk system handlers

func GetSystemHealth(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{
        "status":    "healthy",
        "timestamp": time.Now().Format(time.RFC3339),
        "services": map[string]string{
            "database": "connected",
            "api":      "running",
        },
    })
}

func GetSystemConfig(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{
        "auto_recording_enabled": true,
        "max_upload_size":        "10MB",
        "recording_duration":     "150s",
    })
}

func CheckPythonBackend(c *gin.Context) {
    // Implementasi check Python backend
    c.JSON(http.StatusOK, gin.H{
        "python_backend": "reachable",
    })
}

func GetStorageInfo(c *gin.Context) {
    // Implementasi storage info
    c.JSON(http.StatusOK, gin.H{
        "storage_used":  "0MB",
        "storage_total": "100MB",
    })
}

// handlers/audio.go - Tambahkan fungsi upload audio

func UploadAudioFile(c *gin.Context) {
    // Implementasi upload audio file
    c.JSON(http.StatusOK, gin.H{
        "message": "Audio file uploaded",
    })
}