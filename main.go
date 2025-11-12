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
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
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
		api.POST("/dosen/:id/rekam-suara", handlers.RekamSuaraDosen)

		// Jadwal routes - Diperbarui dengan endpoint baru
		api.POST("/jadwal", handlers.BuatJadwal)
		api.GET("/jadwal", handlers.DapatkanSemuaJadwal)
		api.GET("/jadwal/:id", handlers.DapatkanJadwal)
		api.PUT("/jadwal/:id", handlers.UpdateJadwal)
		api.DELETE("/jadwal/:id", handlers.HapusJadwal)
		api.GET("/jadwal/sedang-rekam", handlers.DapatkanJadwalSedangRekam)
		api.GET("/jadwal/hari-ini/aktif", handlers.DapatkanJadwalAktifHariIni)
		api.GET("/jadwal/hari/:hari", handlers.DapatkanJadwalByHari)
		api.POST("/jadwal/:id/mulai-rekam", handlers.MulaiRekaman)
		api.POST("/jadwal/:id/hentikan-rekam", handlers.HentikanRekaman)
		api.POST("/jadwal/:id/auto-record", handlers.MulaiRekamanOtomatis)
		api.GET("/jadwal/:id/recording-schedule", handlers.GetRecordingSchedule)
		api.PATCH("/jadwal/:id/status", handlers.UpdateStatusJadwal)

		// Evaluasi routes - Diperbarui dengan endpoint baru
		api.POST("/evaluasi", handlers.BuatEvaluasi)
		api.GET("/evaluasi", handlers.DapatkanSemuaEvaluasi)
		api.GET("/evaluasi/:id", handlers.DapatkanEvaluasi)
		api.PUT("/evaluasi/:id", handlers.UpdateEvaluasi)
		api.DELETE("/evaluasi/:id", handlers.HapusEvaluasi)
		api.GET("/evaluasi/jadwal/:jadwal_id", handlers.DapatkanEvaluasiByJadwal)
		api.POST("/evaluasi/:id/upload-audio", handlers.UploadAudioEvaluasi)
		api.POST("/evaluasi/analisis", handlers.SimpanHasilAnalisis)
		api.GET("/evaluasi/statistik", handlers.GetStatistikEvaluasi)
		api.GET("/evaluasi/recent", handlers.GetEvaluasiRecent)

		// Audio file routes
		api.GET("/audio/:dosenFolder/:filename", handlers.ServeAudioFile)
		api.GET("/audio-evaluasi/:folderName/:filename", handlers.ServeAudioEvaluasi)
		api.POST("/audio/upload", handlers.UploadAudioFile)

		// Recording routes (untuk service rekaman otomatis)
		api.POST("/recording/scheduled/start/:jadwal_id", handlers.StartScheduledRecording)
		api.POST("/recording/scheduled/stop/:jadwal_id", handlers.StopScheduledRecording)
		api.GET("/recording/active", handlers.GetActiveRecordings)
		api.GET("/recording/status/:jadwal_id", handlers.GetRecordingStatus)
		api.POST("/recording/process-analysis", handlers.ProcessAudioAnalysis)

		// Dashboard routes
		api.GET("/dashboard/overview", handlers.GetDashboardOverview)
		api.GET("/dashboard/activities", handlers.GetRecentActivities)
		api.GET("/dashboard/stats", handlers.GetDashboardStats)
		api.GET("/dashboard/upcoming-jadwal", handlers.GetUpcomingJadwal)

		// System routes
		api.GET("/system/health", handlers.GetSystemHealth)
		api.GET("/system/config", handlers.GetSystemConfig)
		api.GET("/system/check-python-backend", handlers.CheckPythonBackend)
		api.GET("/system/storage-info", handlers.GetStorageInfo)
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "sehat",
			"layanan":   "CLAIRE Backend",
			"versi":     "1.0.0",
			"database":  "MySQL",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	})

	// Root endpoint
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message":   "CLAIRE Backend API",
			"version":   "1.0.0",
			"endpoints": map[string]string{
				"dosen":      "/api/v1/dosen",
				"jadwal":     "/api/v1/jadwal",
				"evaluasi":   "/api/v1/evaluasi",
				"dashboard":  "/api/v1/dashboard",
				"recording":  "/api/v1/recording",
				"system":     "/api/v1/system",
			},
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