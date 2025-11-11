package handlers

import (
	"net/http"

	"CLAIRE/database"
	"CLAIRE/models"

	"github.com/gin-gonic/gin"
)

func BuatDosen(c *gin.Context) {
	var dosen models.Dosen
	if err := c.ShouldBindJSON(&dosen); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := database.GetDB()
	result := db.Create(&dosen)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusCreated, dosen)
}

func DapatkanSemuaDosen(c *gin.Context) {
	var dosen []models.Dosen
	
	db := database.GetDB()
	result := db.Find(&dosen)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, dosen)
}

func DapatkanDosen(c *gin.Context) {
	id := c.Param("id")
	
	var dosen models.Dosen
	db := database.GetDB()
	result := db.First(&dosen, "id = ?", id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Dosen tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, dosen)
}

func UpdateDosen(c *gin.Context) {
	id := c.Param("id")
	
	var dosen models.Dosen
	if err := c.ShouldBindJSON(&dosen); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := database.GetDB()
	result := db.Model(&models.Dosen{}).Where("id = ?", id).Updates(dosen)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Dosen berhasil diupdate"})
}

func HapusDosen(c *gin.Context) {
	id := c.Param("id")
	
	db := database.GetDB()
	result := db.Delete(&models.Dosen{}, "id = ?", id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Dosen berhasil dihapus"})
}

func RekamSuaraDosen(c *gin.Context) {
	// Placeholder untuk fungsi rekaman suara
	c.JSON(http.StatusOK, gin.H{
		"message": "Endpoint rekaman suara - akan diimplementasikan",
		"dosen_id": c.Param("id"),
	})
}