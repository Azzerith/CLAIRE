package config

import (
	"os"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBCharset  string
	DBParseTime string
	DBLoc      string
}

func LoadConfig() *Config {
	return &Config{
		DBHost:      getEnv("DB_HOST", "localhost"),
		DBPort:      getEnv("DB_PORT", "3306"),
		DBUser:      getEnv("DB_USER", "root"),
		DBPassword:  getEnv("DB_PASSWORD", ""),
		DBName:      getEnv("DB_NAME", "claire_db"),
		DBCharset:   getEnv("DB_CHARSET", "utf8mb4"),
		DBParseTime: getEnv("DB_PARSE_TIME", "True"),
		DBLoc:       getEnv("DB_LOC", "Local"),
	}
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}