package handlers

import (
	"net/http"
	"time"

	"CLAIRE/database"
	"CLAIRE/models"

	"github.com/gin-gonic/gin"
)

func BuatJadwal(c *gin.Context) {
	var jadwal models.Jadwal
	if err := c.ShouldBindJSON(&jadwal); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validasi waktu
	if jadwal.WaktuSelesai.Before(jadwal.WaktuMulai) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Waktu selesai tidak boleh sebelum waktu mulai"})
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