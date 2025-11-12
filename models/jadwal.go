package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Jadwal struct {
	ID              uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	NamaMatkul      string         `gorm:"type:varchar(100);not null" json:"nama_matkul"`
	DosenID         uuid.UUID      `gorm:"type:char(36);not null" json:"dosen_id"`
	Dosen           Dosen          `gorm:"foreignKey:DosenID" json:"dosen"`
	Hari            string         `gorm:"type:varchar(10);not null" json:"hari"`
	WaktuMulai      string         `gorm:"type:varchar(5);not null" json:"waktu_mulai"`
	WaktuSelesai    string         `gorm:"type:varchar(5);not null" json:"waktu_selesai"`
	Ruangan         string         `gorm:"type:varchar(50)" json:"ruangan"`
	Status          string         `gorm:"type:varchar(20);default:'terjadwal'" json:"status"`
	SedangRekam     bool           `gorm:"default:false" json:"sedang_rekam"`
	TanggalDibuat   time.Time      `json:"tanggal_dibuat"`
	TanggalDiupdate time.Time      `json:"tanggal_diupdate"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

func (jadwal *Jadwal) BeforeCreate(tx *gorm.DB) error {
	jadwal.ID = uuid.New()
	jadwal.TanggalDibuat = time.Now()
	jadwal.TanggalDiupdate = time.Now()
	return nil
}

func (jadwal *Jadwal) BeforeUpdate(tx *gorm.DB) error {
	jadwal.TanggalDiupdate = time.Now()
	return nil
}

// Method untuk mengecek apakah jadwal sedang berlangsung
func (j *Jadwal) IsOngoing() bool {
	now := time.Now()
	
	// Konversi hari ke format yang sama
	daysMap := map[string]string{
		"Monday":    "SENIN",
		"Tuesday":   "SELASA", 
		"Wednesday": "RABU",
		"Thursday":  "KAMIS",
		"Friday":    "JUMAT",
		"Saturday":  "SABTU",
		"Sunday":    "MINGGU",
	}
	
	currentDay := daysMap[now.Format("Monday")]
	if currentDay != j.Hari {
		return false
	}
	
	currentTime := now.Format("15:04")
	return currentTime >= j.WaktuMulai && currentTime <= j.WaktuSelesai
}

// Method untuk mengecek apakah jadwal sudah selesai
func (j *Jadwal) IsCompleted() bool {
	now := time.Now()
	
	daysMap := map[string]string{
		"Monday":    "SENIN",
		"Tuesday":   "SELASA",
		"Wednesday": "RABU", 
		"Thursday":  "KAMIS",
		"Friday":    "JUMAT",
		"Saturday":  "SABTU",
		"Sunday":    "MINGGU",
	}
	
	currentDay := daysMap[now.Format("Monday")]
	currentTime := now.Format("15:04")
	
	// Jika hari sudah lewat atau waktu sudah lewat
	if currentDay != j.Hari {
		// Cek urutan hari
		dayOrder := map[string]int{
			"SENIN": 1, "SELASA": 2, "RABU": 3, "KAMIS": 4, 
			"JUMAT": 5, "SABTU": 6, "MINGGU": 7,
		}
		return dayOrder[currentDay] > dayOrder[j.Hari]
	}
	
	return currentTime > j.WaktuSelesai
}