package handlers

import (
	"net/http"

	"CLAIRE/database"
	"CLAIRE/models"

	"github.com/gin-gonic/gin"
)

func BuatEvaluasi(c *gin.Context) {
	var evaluasi models.Evaluasi
	if err := c.ShouldBindJSON(&evaluasi); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := database.GetDB()
	result := db.Create(&evaluasi)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	// Load jadwal dan data dosen
	db.Preload("Jadwal.Dosen").First(&evaluasi, evaluasi.ID)

	c.JSON(http.StatusCreated, evaluasi)
}

func DapatkanSemuaEvaluasi(c *gin.Context) {
	var evaluasi []models.Evaluasi
	
	db := database.GetDB()
	result := db.Preload("Jadwal.Dosen").Find(&evaluasi)
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
	
	var evaluasi models.Evaluasi
	db := database.GetDB()
	result := db.Preload("Jadwal.Dosen").First(&evaluasi, "jadwal_id = ?", jadwalID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Evaluasi tidak ditemukan untuk jadwal ini"})
		return
	}

	c.JSON(http.StatusOK, evaluasi)
}