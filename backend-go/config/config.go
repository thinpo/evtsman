package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	StorageType string
	CSV         CSVConfig
	Postgres    PostgresConfig
	SQLite      SQLiteConfig
}

type CSVConfig struct {
	DataPath       string
	CountriesPath  string
	ExchangesPath  string
	EventTypesPath string
	EventsPath     string
}

type PostgresConfig struct {
	Host     string
	Port     int
	Database string
	User     string
	Password string
}

type SQLiteConfig struct {
	Filename string
}

func LoadConfig() (*Config, error) {
	// Load .env file if it exists
	godotenv.Load()

	// Get the base directory
	baseDir, err := os.Getwd()
	if err != nil {
		return nil, fmt.Errorf("failed to get working directory: %v", err)
	}

	// Create data directory if it doesn't exist
	dataDir := filepath.Join(baseDir, "data")
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data directory: %v", err)
	}

	// Default configuration
	config := &Config{
		StorageType: getEnv("STORAGE_TYPE", "csv"),
		CSV: CSVConfig{
			DataPath:       filepath.Join(dataDir, "data.csv"),
			CountriesPath:  filepath.Join(dataDir, "countries.csv"),
			ExchangesPath:  filepath.Join(dataDir, "exchanges.csv"),
			EventTypesPath: filepath.Join(dataDir, "event_types.csv"),
			EventsPath:     filepath.Join(dataDir, "events.csv"),
		},
		Postgres: PostgresConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnvAsInt("DB_PORT", 5432),
			Database: getEnv("DB_NAME", "events_db"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "postgres"),
		},
		SQLite: SQLiteConfig{
			Filename: getEnv("SQLITE_FILE", filepath.Join(dataDir, "events.db")),
		},
	}

	return config, nil
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value, exists := os.LookupEnv(key); exists {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
} 