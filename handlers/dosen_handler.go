package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"CLAIRE/database"
	"CLAIRE/models"
	"CLAIRE/utils"

	"github.com/gin-gonic/gin"
)

// Konstanta untuk path penyimpanan
const (
	AudioUploadDir = "sampel_suara"
	MaxUploadSize  = 10 << 20 // 10MB
)

func BuatDosen(c *gin.Context) {
	// Parse form data
	nama := c.PostForm("nama")
	gelar := c.PostForm("gelar")
	file, err := c.FormFile("sample_suara")
	
	if nama == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama dosen wajib diisi"})
		return
	}

	var pathSampleSuara string

	// Handle file upload jika ada
	if err == nil && file != nil {
		// Validasi size file
		if file.Size > MaxUploadSize {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File terlalu besar. Maksimal 10MB"})
			return
		}

		// Simpan file audio
		pathSampleSuara, err = utils.SaveAudioFile(file, AudioUploadDir)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Gagal menyimpan file audio: %v", err)})
			return
		}
	} else if err != nil && err != http.ErrMissingFile {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Error upload file: %v", err)})
		return
	}

	// Buat objek dosen
	dosen := models.Dosen{
		Nama:            nama,
		Gelar:           gelar,
		PathSampleSuara: pathSampleSuara,
	}

	db := database.GetDB()
	result := db.Create(&dosen)
	if result.Error != nil {
		// Hapus file yang sudah diupload jika gagal simpan ke database
		if pathSampleSuara != "" {
			utils.DeleteAudioFile(pathSampleSuara)
		}
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
	
	// Cek apakah dosen exists
	var existingDosen models.Dosen
	db := database.GetDB()
	result := db.First(&existingDosen, "id = ?", id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Dosen tidak ditemukan"})
		return
	}

	// Parse form data
	nama := c.PostForm("nama")
	gelar := c.PostForm("gelar")
	file, err := c.FormFile("sample_suara")

	updateData := make(map[string]interface{})
	
	if nama != "" {
		updateData["nama"] = nama
	}
	if gelar != "" {
		updateData["gelar"] = gelar
	}

	// Handle file upload jika ada file baru
	if err == nil && file != nil {
		// Validasi size file
		if file.Size > MaxUploadSize {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File terlalu besar. Maksimal 10MB"})
			return
		}

		// Hapus file lama jika ada
		if existingDosen.PathSampleSuara != "" {
			utils.DeleteAudioFile(existingDosen.PathSampleSuara)
		}

		// Simpan file baru
		pathSampleSuara, err := utils.SaveAudioFile(file, AudioUploadDir)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Gagal menyimpan file audio: %v", err)})
			return
		}
		updateData["path_sample_suara"] = pathSampleSuara
	}

	// Update data dosen
	result = db.Model(&models.Dosen{}).Where("id = ?", id).Updates(updateData)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Dosen berhasil diupdate"})
}

func HapusDosen(c *gin.Context) {
	id := c.Param("id")
	
	// Cek apakah dosen exists dan ambil path file
	var dosen models.Dosen
	db := database.GetDB()
	result := db.First(&dosen, "id = ?", id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Dosen tidak ditemukan"})
		return
	}

	// Hapus file audio jika ada
	if dosen.PathSampleSuara != "" {
		utils.DeleteAudioFile(dosen.PathSampleSuara)
	}

	// Hapus dari database
	result = db.Delete(&models.Dosen{}, "id = ?", id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Dosen berhasil dihapus"})
}

func RekamSuaraDosen(c *gin.Context) {
	// Untuk rekaman live, kita akan terima file audio yang sudah direkam
	file, err := c.FormFile("audio_data")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File audio wajib diupload"})
		return
	}

	dosenID := c.Param("id")
	
	// Validasi size file
	if file.Size > MaxUploadSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File terlalu besar. Maksimal 10MB"})
		return
	}

	// Simpan file audio
	pathSampleSuara, err := utils.SaveAudioFile(file, AudioUploadDir)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Gagal menyimpan file audio: %v", err)})
		return
	}

	// Update path sample suara dosen
	db := database.GetDB()
	result := db.Model(&models.Dosen{}).Where("id = ?", dosenID).Update("path_sample_suara", pathSampleSuara)
	if result.Error != nil {
		// Hapus file yang sudah diupload jika gagal update database
		utils.DeleteAudioFile(pathSampleSuara)
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Sample suara dosen berhasil disimpan",
		"path":    pathSampleSuara,
		"dosen_id": dosenID,
	})
}

// Handler untuk serve file audio
func ServeAudioFile(c *gin.Context) {
	filename := c.Param("filename")
	filePath := filepath.Join(AudioUploadDir, filename)

	// Validasi untuk mencegah directory traversal
	if !strings.HasPrefix(filepath.Clean(filePath), AudioUploadDir) {
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