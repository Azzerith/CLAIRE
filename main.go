package main

import (
	"log"
	"os"
	"time"

	"CLAIRE/database"
	"CLAIRE/handlers"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("File .env tidak ditemukan, menggunakan environment variables system")
	}

	// Initialize database dengan retry mechanism
	var db *gorm.DB
	var err error
	
	for i := 0; i < 5; i++ {
		db, err = database.InitDB()
		if err == nil {
			break
		}
		log.Printf("Gagal connect ke database, percobaan %d: %v", i+1, err)
		time.Sleep(3 * time.Second)
	}
	
	if err != nil {
		log.Fatal("Gagal connect ke database setelah beberapa percobaan:", err)
	}
	log.Println("Database connected successfully")

	// Auto migrate models
	if err := database.MigrateDB(db); err != nil {
		log.Fatal("Gagal migrasi database:", err)
	}

	// Initialize Gin router
	router := gin.Default()

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// API routes
	api := router.Group("/api/v1")
	{
		// Dosen routes
		api.POST("/dosen", handlers.BuatDosen)
		api.GET("/dosen", handlers.DapatkanSemuaDosen)
		api.GET("/dosen/:id", handlers.DapatkanDosen)
		api.PUT("/dosen/:id", handlers.UpdateDosen)
		api.DELETE("/dosen/:id", handlers.HapusDosen)

		// Jadwal routes
		api.POST("/jadwal", handlers.BuatJadwal)
		api.GET("/jadwal", handlers.DapatkanSemuaJadwal)
		api.GET("/jadwal/:id", handlers.DapatkanJadwal)
		api.PUT("/jadwal/:id", handlers.UpdateJadwal)
		api.DELETE("/jadwal/:id", handlers.HapusJadwal)
		api.GET("/jadwal/sedang-rekam", handlers.DapatkanJadwalSedangRekam)

		// Evaluasi routes
		api.POST("/evaluasi", handlers.BuatEvaluasi)
		api.GET("/evaluasi", handlers.DapatkanSemuaEvaluasi)
		api.GET("/evaluasi/:id", handlers.DapatkanEvaluasi)
		api.GET("/evaluasi/jadwal/:jadwal_id", handlers.DapatkanEvaluasiByJadwal)

		// Rekaman suara routes
		api.POST("/dosen/:id/rekam-suara", handlers.RekamSuaraDosen)
		api.GET("/rekaman/mulai/:jadwal_id", handlers.MulaiRekaman)
		api.GET("/rekaman/hentikan/:jadwal_id", handlers.HentikanRekaman)

		api.GET("/sampel_suara/:dosenFolder/:filename", handlers.ServeAudioFile)
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "sehat",
			"layanan":   "CLAIRE Backend",
			"versi":     "1.0.0",
			"database":  "MySQL",
		})
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("CLAIRE Backend Server mulai pada port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Gagal memulai server:", err)
	}
}