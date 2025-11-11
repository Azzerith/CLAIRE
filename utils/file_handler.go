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
    allowedExtensions := []string{".wav", ".webm", ".mp3", ".ogg"}
    
    isValidExtension := false
    for _, allowedExt := range allowedExtensions {
        if ext == allowedExt {
            isValidExtension = true
            break
        }
    }
    
    if !isValidExtension {
        return "", fmt.Errorf("hanya file audio yang diizinkan: %s", strings.Join(allowedExtensions, ", "))
    }

    // Generate nama file unik dengan ekstensi .wav
    fileID := uuid.New().String()
    filename := fileID + ".wav" // Selalu simpan sebagai WAV untuk konsistensi
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

    // Copy file (konversi format akan dilakukan di pipeline AI nanti)
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
    
    return "/api/v1/audio/" + filepath.Base(filePath)
}

// CheckAudioFileSize memeriksa ukuran file audio
func CheckAudioFileSize(file *multipart.FileHeader, maxSize int64) error {
    if file.Size > maxSize {
        return fmt.Errorf("ukuran file melebihi batas maksimal %dMB", maxSize/(1024*1024))
    }
    return nil
}