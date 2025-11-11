package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Evaluasi struct {
	ID                   uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	JadwalID             uuid.UUID      `gorm:"type:char(36);not null" json:"jadwal_id"`
	Jadwal               Jadwal         `gorm:"foreignKey:JadwalID" json:"jadwal"`
	KepercayaanPembicara float64        `gorm:"type:decimal(5,4)" json:"kepercayaan_pembicara"`
	TeksTranskripsi      string         `gorm:"type:text" json:"teks_transkripsi"`
	Rangkuman            string         `gorm:"type:text" json:"rangkuman"`
	SkorEfektivitas      float64        `gorm:"type:decimal(3,2)" json:"skor_efektivitas"`
	PathFileAudio        string         `gorm:"type:varchar(255)" json:"path_file_audio"`
	WaktuPemrosesan      float64        `json:"waktu_pemrosesan"`
	TanggalDibuat        time.Time      `json:"tanggal_dibuat"`
	TanggalDiupdate      time.Time      `json:"tanggal_diupdate"`
	DeletedAt            gorm.DeletedAt `gorm:"index" json:"-"`
}

func (evaluasi *Evaluasi) BeforeCreate(tx *gorm.DB) error {
	evaluasi.ID = uuid.New()
	evaluasi.TanggalDibuat = time.Now()
	evaluasi.TanggalDiupdate = time.Now()
	return nil
}

func (evaluasi *Evaluasi) BeforeUpdate(tx *gorm.DB) error {
	evaluasi.TanggalDiupdate = time.Now()
	return nil
}