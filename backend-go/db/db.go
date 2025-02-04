package db

import (
	"events-api/config"
	"events-api/models"
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB(cfg *config.Config) error {
	var err error

	switch cfg.StorageType {
	case "postgres":
		dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
			cfg.Postgres.Host,
			cfg.Postgres.Port,
			cfg.Postgres.User,
			cfg.Postgres.Password,
			cfg.Postgres.Database)
		DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})

	case "sqlite":
		DB, err = gorm.Open(sqlite.Open(cfg.SQLite.Filename), &gorm.Config{})

	default:
		return fmt.Errorf("unsupported storage type: %s", cfg.StorageType)
	}

	if err != nil {
		return fmt.Errorf("failed to connect to database: %v", err)
	}

	// Auto-migrate the schema
	err = DB.AutoMigrate(
		&models.Entry{},
		&models.DropdownValue{},
		&models.Event{},
	)
	if err != nil {
		return fmt.Errorf("failed to migrate database: %v", err)
	}

	return nil
}

func CloseDB() error {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
} 