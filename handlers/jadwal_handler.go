package handlers

import (
	"net/http"
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
	jadwalID := c.Param("jadwal_id")
	
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
	jadwalID := c.Param("jadwal_id")
	
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