package handlers

import (
    "fmt"
    "net/http"
    "os"
    "path/filepath"
    "strings"
    "time"

    "CLAIRE/database"
    "CLAIRE/models"
    "CLAIRE/utils"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
)

// Konstanta untuk path penyimpanan
const (
    AudioUploadDir = "uploads/audio_evaluasi"
    MaxUploadSize  = 50 << 20 // 50MB (lebih besar untuk rekaman panjang)
)

func BuatEvaluasi(c *gin.Context) {
    var evaluasiInput struct {
        JadwalID             string  `json:"jadwal_id" binding:"required"`
        KepercayaanPembicara float64 `json:"kepercayaan_pembicara"`
        TeksTranskripsi      string  `json:"teks_transkripsi"`
        Rangkuman            string  `json:"rangkuman"`
        SkorEfektivitas      float64 `json:"skor_efektivitas"`
        WaktuPemrosesan      float64 `json:"waktu_pemrosesan"`
    }

    if err := c.ShouldBindJSON(&evaluasiInput); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Validasi jadwal_id
    jadwalID, err := uuid.Parse(evaluasiInput.JadwalID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Format jadwal_id tidak valid"})
        return
    }

    // Cek apakah jadwal exists
    var jadwal models.Jadwal
    db := database.GetDB()
    result := db.First(&jadwal, "id = ?", jadwalID)
    if result.Error != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Jadwal tidak ditemukan"})
        return
    }

    // Buat objek evaluasi
    evaluasi := models.Evaluasi{
        JadwalID:             jadwalID,
        KepercayaanPembicara: evaluasiInput.KepercayaanPembicara,
        TeksTranskripsi:      evaluasiInput.TeksTranskripsi,
        Rangkuman:            evaluasiInput.Rangkuman,
        SkorEfektivitas:      evaluasiInput.SkorEfektivitas,
        WaktuPemrosesan:      evaluasiInput.WaktuPemrosesan,
        PathFileAudio:        "", // Akan diisi jika ada upload file
    }

    result = db.Create(&evaluasi)
    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        return
    }

    // Load relasi jadwal dan dosen
    db.Preload("Jadwal.Dosen").First(&evaluasi, evaluasi.ID)

    c.JSON(http.StatusCreated, evaluasi)
}

func UploadAudioEvaluasi(c *gin.Context) {
    evaluasiID := c.Param("id")
    
    // Validasi evaluasi_id
    _, err := uuid.Parse(evaluasiID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Format evaluasi_id tidak valid"})
        return
    }

    // Cek apakah evaluasi exists
    var evaluasi models.Evaluasi
    db := database.GetDB()
    result := db.Preload("Jadwal.Dosen").First(&evaluasi, "id = ?", evaluasiID)
    if result.Error != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Evaluasi tidak ditemukan"})
        return
    }

    file, err := c.FormFile("audio_file")
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "File audio wajib diupload"})
        return
    }

    // Validasi size file
    if err := utils.CheckAudioFileSize(file, MaxUploadSize); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Generate folder name berdasarkan jadwal dan tanggal
    folderName := generateEvaluasiFolderName(evaluasi.JadwalID, evaluasi.Jadwal.Dosen)

    // Hapus file lama jika ada
    if evaluasi.PathFileAudio != "" {
        utils.DeleteAudioFile(evaluasi.PathFileAudio)
    }

    // Simpan file audio baru
    pathFileAudio, err := utils.SaveAudioFile(file, AudioUploadDir, folderName)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Gagal menyimpan file audio: %v", err)})
        return
    }

    // Update path file audio di evaluasi
    result = db.Model(&models.Evaluasi{}).Where("id = ?", evaluasiID).Update("path_file_audio", pathFileAudio)
    if result.Error != nil {
        // Hapus file yang sudah diupload jika gagal update database
        utils.DeleteAudioFile(pathFileAudio)
        c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "File audio evaluasi berhasil disimpan",
        "path":    pathFileAudio,
        "evaluasi_id": evaluasiID,
    })
}

func DapatkanSemuaEvaluasi(c *gin.Context) {
    var evaluasi []models.Evaluasi
    
    db := database.GetDB()
    result := db.Preload("Jadwal.Dosen").Order("tanggal_dibuat DESC").Find(&evaluasi)
    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        return
    }

    c.JSON(http.StatusOK, evaluasi)
}

func DapatkanEvaluasi(c *gin.Context) {
    id := c.Param("id")
    
    var evaluasi models.Evaluasi
    db := database.GetDB()
    result := db.Preload("Jadwal.Dosen").First(&evaluasi, "id = ?", id)
    if result.Error != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Evaluasi tidak ditemukan"})
        return
    }

    c.JSON(http.StatusOK, evaluasi)
}

func DapatkanEvaluasiByJadwal(c *gin.Context) {
    jadwalID := c.Param("jadwal_id")
    
    var evaluasi []models.Evaluasi
    db := database.GetDB()
    result := db.Preload("Jadwal.Dosen").Where("jadwal_id = ?", jadwalID).Order("tanggal_dibuat DESC").Find(&evaluasi)
    if result.Error != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Evaluasi tidak ditemukan untuk jadwal ini"})
        return
    }

    c.JSON(http.StatusOK, evaluasi)
}

func UpdateEvaluasi(c *gin.Context) {
    id := c.Param("id")
    
    // Cek apakah evaluasi exists
    var existingEvaluasi models.Evaluasi
    db := database.GetDB()
    result := db.Preload("Jadwal.Dosen").First(&existingEvaluasi, "id = ?", id)
    if result.Error != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Evaluasi tidak ditemukan"})
        return
    }

    var updateInput struct {
        KepercayaanPembicara *float64 `json:"kepercayaan_pembicara"`
        TeksTranskripsi      *string  `json:"teks_transkripsi"`
        Rangkuman            *string  `json:"rangkuman"`
        SkorEfektivitas      *float64 `json:"skor_efektivitas"`
        WaktuPemrosesan      *float64 `json:"waktu_pemrosesan"`
    }

    if err := c.ShouldBindJSON(&updateInput); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    updateData := make(map[string]interface{})
    
    if updateInput.KepercayaanPembicara != nil {
        updateData["kepercayaan_pembicara"] = *updateInput.KepercayaanPembicara
    }
    if updateInput.TeksTranskripsi != nil {
        updateData["teks_transkripsi"] = *updateInput.TeksTranskripsi
    }
    if updateInput.Rangkuman != nil {
        updateData["rangkuman"] = *updateInput.Rangkuman
    }
    if updateInput.SkorEfektivitas != nil {
        updateData["skor_efektivitas"] = *updateInput.SkorEfektivitas
    }
    if updateInput.WaktuPemrosesan != nil {
        updateData["waktu_pemrosesan"] = *updateInput.WaktuPemrosesan
    }

    // Update data evaluasi
    if len(updateData) > 0 {
        result = db.Model(&models.Evaluasi{}).Where("id = ?", id).Updates(updateData)
        if result.Error != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
            return
        }
    }

    c.JSON(http.StatusOK, gin.H{"message": "Evaluasi berhasil diupdate"})
}

func HapusEvaluasi(c *gin.Context) {
    id := c.Param("id")
    
    // Cek apakah evaluasi exists dan ambil path file
    var evaluasi models.Evaluasi
    db := database.GetDB()
    result := db.First(&evaluasi, "id = ?", id)
    if result.Error != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Evaluasi tidak ditemukan"})
        return
    }

    // Hapus file audio jika ada
    if evaluasi.PathFileAudio != "" {
        utils.DeleteAudioFile(evaluasi.PathFileAudio)
        
        // Hapus folder evaluasi jika kosong
        evaluasiDir := filepath.Dir(evaluasi.PathFileAudio)
        utils.DeleteFolderIfEmpty(evaluasiDir)
    }

    // Hapus dari database
    result = db.Delete(&models.Evaluasi{}, "id = ?", id)
    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Evaluasi berhasil dihapus"})
}

// Handler untuk proses rekaman otomatis dari service
func SimpanHasilAnalisis(c *gin.Context) {
    var analysisInput struct {
        JadwalID             string   `json:"jadwal_id" binding:"required"`
        KepercayaanPembicara float64  `json:"kepercayaan_pembicara"`
        TeksTranskripsi      string   `json:"teks_transkripsi"`
        Rangkuman            string   `json:"rangkuman"`
        SkorEfektivitas      float64  `json:"skor_efektivitas"`
        PathFileAudio        string   `json:"path_file_audio"`
        WaktuPemrosesan      float64  `json:"waktu_pemrosesan"`
        Feedback             string   `json:"feedback"`
        TopikFokus           []string `json:"topik_fokus"`
        KejelasanSkor        float64  `json:"kejelasan_skor"`
        Redundancy           float64  `json:"redundancy"`
    }

    if err := c.ShouldBindJSON(&analysisInput); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Validasi jadwal_id
    jadwalID, err := uuid.Parse(analysisInput.JadwalID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Format jadwal_id tidak valid"})
        return
    }

    // Cek apakah jadwal exists
    var jadwal models.Jadwal
    db := database.GetDB()
    result := db.First(&jadwal, "id = ?", jadwalID)
    if result.Error != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Jadwal tidak ditemukan"})
        return
    }

    // Buat objek evaluasi dari hasil analisis
    evaluasi := models.Evaluasi{
        JadwalID:             jadwalID,
        KepercayaanPembicara: analysisInput.KepercayaanPembicara,
        TeksTranskripsi:      analysisInput.TeksTranskripsi,
        Rangkuman:            analysisInput.Rangkuman,
        SkorEfektivitas:      analysisInput.SkorEfektivitas,
        PathFileAudio:        analysisInput.PathFileAudio,
        WaktuPemrosesan:      analysisInput.WaktuPemrosesan,
    }

    result = db.Create(&evaluasi)
    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        return
    }

    // Load relasi untuk response
    db.Preload("Jadwal.Dosen").First(&evaluasi, evaluasi.ID)

    c.JSON(http.StatusCreated, gin.H{
        "message": "Hasil analisis berhasil disimpan",
        "evaluasi": evaluasi,
    })
}

// Handler untuk serve file audio evaluasi
func ServeAudioEvaluasi(c *gin.Context) {
    folderName := c.Param("folderName")
    filename := c.Param("filename")
    
    // Validasi parameter
    if folderName == "" || filename == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Parameter tidak valid"})
        return
    }

    filePath := filepath.Join(AudioUploadDir, folderName, filename)

    // Validasi untuk mencegah directory traversal
    cleanPath := filepath.Clean(filePath)
    if !strings.HasPrefix(cleanPath, AudioUploadDir) {
        c.JSON(http.StatusForbidden, gin.H{"error": "Akses file tidak diizinkan"})
        return
    }

    // Cek apakah file exists
    if _, err := os.Stat(filePath); os.IsNotExist(err) {
        c.JSON(http.StatusNotFound, gin.H{"error": "File audio tidak ditemukan"})
        return
    }

    // Serve file
    c.File(filePath)
}

// Helper function untuk generate folder name evaluasi
func generateEvaluasiFolderName(jadwalID uuid.UUID, dosen models.Dosen) string {
    timestamp := time.Now().Format("20060102_150405")
    cleanDosenName := strings.ReplaceAll(strings.TrimSpace(dosen.Nama), " ", "_")
    
    folderName := fmt.Sprintf("jadwal_%s_%s_%s", 
        jadwalID.String()[:8], 
        cleanDosenName, 
        timestamp)
    
    // Hapus karakter non-alphanumeric kecuali underscore
    var result strings.Builder
    for _, char := range folderName {
        if (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || 
           (char >= '0' && char <= '9') || char == '_' {
            result.WriteRune(char)
        }
    }
    
    return result.String()
}