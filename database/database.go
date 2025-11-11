package database

import (
	"fmt"
	"log"

	"CLAIRE/config"
	"CLAIRE/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() (*gorm.DB, error) {
	cfg := config.LoadConfig()

	// Format DSN untuk MySQL: "user:password@tcp(host:port)/dbname?charset=utf8mb4&parseTime=True&loc=Local"
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=%s&parseTime=%s&loc=%s",
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
		cfg.DBCharset,
		cfg.DBParseTime,
		cfg.DBLoc,
	)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	DB = db
	log.Println("Koneksi database MySQL berhasil")
	return DB, nil
}

func MigrateDB(db *gorm.DB) error {
	err := db.AutoMigrate(
		&models.Dosen{},
		&models.Jadwal{},
		&models.Evaluasi{},
	)
	if err != nil {
		return err
	}
	log.Println("Migrasi database MySQL selesai")
	return nil
}

func GetDB() *gorm.DB {
	return DB
}