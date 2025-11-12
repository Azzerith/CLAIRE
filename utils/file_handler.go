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
func SaveAudioFile(file *multipart.FileHeader, uploadDir string, dosenFolder string) (string, error) {
    // Buat path direktori dosen
    dosenDir := filepath.Join(uploadDir, dosenFolder)
    
    // Buat direktori jika belum ada
    if err := EnsureDir(dosenDir); err != nil {
        return "", fmt.Errorf("gagal membuat direktori dosen: %v", err)
    }

    // Validasi ekstensi file
    ext := strings.ToLower(filepath.Ext(file.Filename))
    allowedExtensions := []string{".wav", ".webm", ".mp3", ".ogg", ".m4a", ".flac"}
    
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
    filePath := filepath.Join(dosenDir, filename)

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

// DeleteDosenFolder menghapus seluruh folder dosen
func DeleteDosenFolder(uploadDir string, dosenFolder string) error {
    if dosenFolder == "" {
        return nil
    }
    
    dosenDir := filepath.Join(uploadDir, dosenFolder)
    if _, err := os.Stat(dosenDir); os.IsNotExist(err) {
        return nil // Folder tidak ada, tidak perlu dihapus
    }
    
    return os.RemoveAll(dosenDir)
}

// GetAudioFileURL mengembalikan URL untuk mengakses file audio
func GetAudioFileURL(filePath string) string {
    if filePath == "" {
        return ""
    }
    
    return "/api/v1/audio/" + filepath.Base(filepath.Dir(filePath)) + "/" + filepath.Base(filePath)
}

// CheckAudioFileSize memeriksa ukuran file audio
func CheckAudioFileSize(file *multipart.FileHeader, maxSize int64) error {
    if file.Size > maxSize {
        return fmt.Errorf("ukuran file melebihi batas maksimal %dMB", maxSize/(1024*1024))
    }
    return nil
}

// GenerateDosenFolderName menghasilkan nama folder untuk dosen
func GenerateDosenFolderName(nama string, gelar string) string {
    // Bersihkan nama dan gelar dari karakter yang tidak valid untuk nama folder
    cleanName := strings.ReplaceAll(strings.TrimSpace(nama), " ", "_")
    cleanGelar := strings.ReplaceAll(strings.TrimSpace(gelar), " ", "_")
    
    // Gabungkan nama dan gelar
    folderName := cleanName
    if cleanGelar != "" {
        folderName = folderName + "_" + cleanGelar
    }
    
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

// DeleteFolderIfEmpty menghapus folder jika kosong
func DeleteFolderIfEmpty(dirPath string) error {
    if dirPath == "" {
        return nil
    }
    
    // Cek apakah folder exists
    if _, err := os.Stat(dirPath); os.IsNotExist(err) {
        return nil // Folder tidak ada
    }
    
    // Baca isi folder
    entries, err := os.ReadDir(dirPath)
    if err != nil {
        return err
    }
    
    // Hapus hanya jika folder kosong
    if len(entries) == 0 {
        return os.Remove(dirPath)
    }
    
    return nil
}

// GetFileSize mengembalikan ukuran file dalam bytes
func GetFileSize(filePath string) (int64, error) {
    fileInfo, err := os.Stat(filePath)
    if err != nil {
        return 0, err
    }
    return fileInfo.Size(), nil
}