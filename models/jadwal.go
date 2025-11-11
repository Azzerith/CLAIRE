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
	WaktuMulai      time.Time      `gorm:"not null" json:"waktu_mulai"`
	WaktuSelesai    time.Time      `gorm:"not null" json:"waktu_selesai"`
	Ruangan         string         `gorm:"type:varchar(50)" json:"ruangan"`
	Status          string         `gorm:"type:varchar(20);default:'terjadwal'" json:"status"` // terjadwal, merekam, selesai, dibatalkan
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