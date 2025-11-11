package utils

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

// EnsureDir membuat direktori jika belum ada
func EnsureDir(dirPath string) error {
	if _, err := os.Stat(dirPath); os.IsNotExist(err) {
		return os.MkdirAll(dirPath, 0755)
	}
	return nil
}

// SaveAudioFile menyimpan file audio dan mengembalikan path-nya
func SaveAudioFile(file *multipart.FileHeader, uploadDir string) (string, error) {
	// Buat direktori jika belum ada
	if err := EnsureDir(uploadDir); err != nil {
		return "", fmt.Errorf("gagal membuat direktori: %v", err)
	}

	// Validasi ekstensi file
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".wav" {
		return "", fmt.Errorf("hanya file .wav yang diizinkan")
	}

	// Generate nama file unik
	fileID := uuid.New().String()
	filename := fileID + ".wav"
	filePath := filepath.Join(uploadDir, filename)

	// Buka file source
	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("gagal membuka file: %v", err)
	}
	defer src.Close()

	// Buat file destination
	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("gagal membuat file: %v", err)
	}
	defer dst.Close()

	// Copy file
	if _, err = io.Copy(dst, src); err != nil {
		return "", fmt.Errorf("gagal menyalin file: %v", err)
	}

	return filePath, nil
}

// DeleteAudioFile menghapus file audio
func DeleteAudioFile(filePath string) error {
	if filePath == "" {
		return nil
	}
	
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil // File tidak ada, tidak perlu dihapus
	}
	
	return os.Remove(filePath)
}

// GetAudioFileURL mengembalikan URL untuk mengakses file audio
func GetAudioFileURL(filePath string) string {
	if filePath == "" {
		return ""
	}
	
	// Untuk sementara, return path relatif
	// Di production, bisa diganti dengan base URL CDN atau static file server
	return "/api/v1/audio/" + filepath.Base(filePath)
}