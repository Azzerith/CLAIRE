package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Dosen struct {
	ID              uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	Nama            string         `gorm:"type:varchar(100);not null" json:"nama"`
	Gelar           string         `gorm:"type:varchar(50)" json:"gelar"`
	PathSampleSuara string         `gorm:"type:varchar(255)" json:"path_sample_suara"`
	FolderDosen     string `gorm:"size:255" json:"folder_dosen"`
	TanggalDibuat   time.Time      `json:"tanggal_dibuat"`
	TanggalDiupdate time.Time      `json:"tanggal_diupdate"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

func (dosen *Dosen) BeforeCreate(tx *gorm.DB) error {
	dosen.ID = uuid.New()
	dosen.TanggalDibuat = time.Now()
	dosen.TanggalDiupdate = time.Now()
	return nil
}

func (dosen *Dosen) BeforeUpdate(tx *gorm.DB) error {
	dosen.TanggalDiupdate = time.Now()
	return nil
}