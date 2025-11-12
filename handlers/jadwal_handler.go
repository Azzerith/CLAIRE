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

	// Validasi format waktu (HH:MM)
	if !isValidTime(jadwal.WaktuMulai) || !isValidTime(jadwal.WaktuSelesai) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format waktu tidak valid. Gunakan format HH:MM"})
		return
	}

	// Validasi waktu selesai harus setelah waktu mulai
	if jadwal.WaktuSelesai <= jadwal.WaktuMulai {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Waktu selesai harus setelah waktu mulai"})
		return
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

func DapatkanSemuaJadwal(c *gin.Context) {
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
	result := db.Model(&models.Jadwal{}).Where("id = ?", jadwalID).Updates(map[string]interface{}{
		"sedang_rekam": false,
		"status":       "selesai",
		"tanggal_diupdate": time.Now(),
	})
	
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Rekaman dihentikan"})
}