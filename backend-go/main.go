package main

import (
	"events-api/config"
	"events-api/db"
	"events-api/models"
	"events-api/utils"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Printf("Failed to load configuration: %v\n", err)
		os.Exit(1)
	}

	// Initialize database if using PostgreSQL or SQLite
	if cfg.StorageType != "csv" {
		if err := db.InitDB(cfg); err != nil {
			fmt.Printf("Failed to initialize database: %v\n", err)
			os.Exit(1)
		}
		defer db.CloseDB()
	}

	// Initialize Gin router
	router := gin.Default()

	// Configure CORS
	router.Use(cors.Default())
	router.Use(utils.ErrorHandler())

	// API routes
	router.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "", getAPIDocumentation(cfg))
	})

	// Entries routes
	router.GET("/entries", handleGetEntries(cfg))
	router.POST("/entries", handleCreateEntry(cfg))
	router.PUT("/entries/:id", handleUpdateEntry(cfg))
	router.DELETE("/entries/:id", handleDeleteEntry(cfg))

	// Dropdowns routes
	router.GET("/dropdowns", handleGetDropdowns(cfg))
	router.POST("/dropdowns/:key", handleAddDropdownValue(cfg))
	router.DELETE("/dropdowns/:key", handleDeleteDropdownValue(cfg))
	router.PUT("/dropdowns/:key/reorder", handleReorderDropdownValues(cfg))

	// Events routes
	router.GET("/events", handleGetEvents(cfg))
	router.POST("/events", handleCreateEvent(cfg))

	// Start server
	port := 5001
	for {
		if err := router.Run(fmt.Sprintf(":%d", port)); err != nil {
			if err.Error() == "listen tcp :5001: bind: address already in use" {
				fmt.Printf("Port %d is busy, trying %d\n", port, port+1)
				port++
				continue
			}
			fmt.Printf("Failed to start server: %v\n", err)
			os.Exit(1)
		}
		break
	}

	// Handle graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	fmt.Println("Shutting down server...")
}

func handleGetEntries(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		if cfg.StorageType != "csv" {
			var entries []models.Entry
			if err := db.DB.Order("when_input desc").Find(&entries).Error; err != nil {
				c.Error(utils.NewInternalError(fmt.Sprintf("Failed to get entries: %v", err)))
				return
			}
			c.JSON(http.StatusOK, entries)
			return
		}

		entries, err := utils.ReadCSV(cfg.CSV.DataPath)
		if err != nil {
			c.Error(utils.NewInternalError(fmt.Sprintf("Failed to read entries: %v", err)))
			return
		}
		c.JSON(http.StatusOK, entries)
	}
}

func handleCreateEntry(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var entry models.Entry
		if err := c.ShouldBindJSON(&entry); err != nil {
			c.Error(utils.NewValidationError("Invalid entry data"))
			return
		}

		entry.ID = strconv.FormatInt(time.Now().UnixNano()/1000000, 10)

		if cfg.StorageType != "csv" {
			if err := db.DB.Create(&entry).Error; err != nil {
				c.Error(utils.NewInternalError(fmt.Sprintf("Failed to create entry: %v", err)))
				return
			}
			c.JSON(http.StatusCreated, entry)
			return
		}

		entries, err := utils.ReadCSV(cfg.CSV.DataPath)
		if err != nil {
			c.Error(utils.NewInternalError(fmt.Sprintf("Failed to read entries: %v", err)))
			return
		}

		entryMap := make(map[string]interface{})
		entryMap["id"] = entry.ID
		entryMap["date"] = entry.Date
		entryMap["month"] = entry.Month
		entryMap["origin_country"] = entry.OriginCountry
		entryMap["main_impact_country"] = entry.MainImpactCountry
		entryMap["relevant_exchange"] = entry.RelevantExchange
		entryMap["event_type"] = entry.EventType
		entryMap["who_input"] = entry.WhoInput
		entryMap["when_input"] = entry.WhenInput
		entryMap["details"] = entry.Details

		entries = append(entries, entryMap)
		if err := utils.WriteCSV(cfg.CSV.DataPath, entries); err != nil {
			c.Error(utils.NewInternalError(fmt.Sprintf("Failed to write entries: %v", err)))
			return
		}

		c.JSON(http.StatusCreated, entry)
	}
}

func handleUpdateEntry(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var entry models.Entry
		if err := c.ShouldBindJSON(&entry); err != nil {
			c.Error(utils.NewValidationError("Invalid entry data"))
			return
		}

		if cfg.StorageType != "csv" {
			var existingEntry models.Entry
			if err := db.DB.First(&existingEntry, "id = ?", id).Error; err != nil {
				c.Error(utils.NewNotFoundError("Entry not found"))
				return
			}

			if err := db.DB.Model(&existingEntry).Updates(entry).Error; err != nil {
				c.Error(utils.NewInternalError(fmt.Sprintf("Failed to update entry: %v", err)))
				return
			}
			c.JSON(http.StatusOK, existingEntry)
			return
		}

		entries, err := utils.ReadCSV(cfg.CSV.DataPath)
		if err != nil {
			c.Error(utils.NewInternalError(fmt.Sprintf("Failed to read entries: %v", err)))
			return
		}

		found := false
		for i, e := range entries {
			if e["id"].(string) == id {
				entries[i]["date"] = entry.Date
				entries[i]["month"] = entry.Month
				entries[i]["origin_country"] = entry.OriginCountry
				entries[i]["main_impact_country"] = entry.MainImpactCountry
				entries[i]["relevant_exchange"] = entry.RelevantExchange
				entries[i]["event_type"] = entry.EventType
				entries[i]["who_input"] = entry.WhoInput
				entries[i]["when_input"] = entry.WhenInput
				entries[i]["details"] = entry.Details
				found = true
				break
			}
		}

		if !found {
			c.Error(utils.NewNotFoundError("Entry not found"))
			return
		}

		if err := utils.WriteCSV(cfg.CSV.DataPath, entries); err != nil {
			c.Error(utils.NewInternalError(fmt.Sprintf("Failed to write entries: %v", err)))
			return
		}

		c.JSON(http.StatusOK, entry)
	}
}

func handleDeleteEntry(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		if cfg.StorageType != "csv" {
			var entry models.Entry
			if err := db.DB.First(&entry, "id = ?", id).Error; err != nil {
				c.Error(utils.NewNotFoundError("Entry not found"))
				return
			}

			if err := db.DB.Delete(&entry).Error; err != nil {
				c.Error(utils.NewInternalError(fmt.Sprintf("Failed to delete entry: %v", err)))
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true})
			return
		}

		entries, err := utils.ReadCSV(cfg.CSV.DataPath)
		if err != nil {
			c.Error(utils.NewInternalError(fmt.Sprintf("Failed to read entries: %v", err)))
			return
		}

		found := false
		var newEntries []map[string]interface{}
		for _, e := range entries {
			if e["id"].(string) != id {
				newEntries = append(newEntries, e)
			} else {
				found = true
			}
		}

		if !found {
			c.Error(utils.NewNotFoundError("Entry not found"))
			return
		}

		if err := utils.WriteCSV(cfg.CSV.DataPath, newEntries); err != nil {
			c.Error(utils.NewInternalError(fmt.Sprintf("Failed to write entries: %v", err)))
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true})
	}
}

func handleGetDropdowns(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		if cfg.StorageType != "csv" {
			var countries, exchanges, eventTypes []models.DropdownValue
			if err := db.DB.Order("order_index asc").Find(&countries, "table_name = ?", "countries").Error; err != nil {
				c.Error(utils.NewInternalError(fmt.Sprintf("Failed to get countries: %v", err)))
				return
			}
			if err := db.DB.Order("order_index asc").Find(&exchanges, "table_name = ?", "exchanges").Error; err != nil {
				c.Error(utils.NewInternalError(fmt.Sprintf("Failed to get exchanges: %v", err)))
				return
			}
			if err := db.DB.Order("order_index asc").Find(&eventTypes, "table_name = ?", "event_types").Error; err != nil {
				c.Error(utils.NewInternalError(fmt.Sprintf("Failed to get event types: %v", err)))
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"origin_country":      countries,
				"main_impact_country": countries,
				"relevant_exchange":   exchanges,
				"event_type":          eventTypes,
			})
			return
		}

		countries, err := utils.ReadDropdownValues(cfg.CSV.CountriesPath)
		if err != nil {
			c.Error(utils.NewInternalError(fmt.Sprintf("Failed to read countries: %v", err)))
			return
		}

		exchanges, err := utils.ReadDropdownValues(cfg.CSV.ExchangesPath)
		if err != nil {
			c.Error(utils.NewInternalError(fmt.Sprintf("Failed to read exchanges: %v", err)))
			return
		}

		eventTypes, err := utils.ReadDropdownValues(cfg.CSV.EventTypesPath)
		if err != nil {
			c.Error(utils.NewInternalError(fmt.Sprintf("Failed to read event types: %v", err)))
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"origin_country":      countries,
			"main_impact_country": countries,
			"relevant_exchange":   exchanges,
			"event_type":          eventTypes,
		})
	}
}

func handleAddDropdownValue(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.Param("key")
		var input struct {
			Value string `json:"value" binding:"required"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.Error(utils.NewValidationError("Value is required"))
			return
		}

		var tableName string
		var filePath string
		switch key {
		case "origin_country", "main_impact_country":
			tableName = "countries"
			filePath = cfg.CSV.CountriesPath
		case "relevant_exchange":
			tableName = "exchanges"
			filePath = cfg.CSV.ExchangesPath
		case "event_type":
			tableName = "event_types"
			filePath = cfg.CSV.EventTypesPath
		default:
			c.Error(utils.NewValidationError("Invalid dropdown key"))
			return
		}

		if cfg.StorageType != "csv" {
			var maxOrder int
			if err := db.DB.Model(&models.DropdownValue{}).Where("table_name = ?", tableName).Select("COALESCE(MAX(order_index), -1)").Scan(&maxOrder).Error; err != nil {
				c.Error(utils.NewInternalError(fmt.Sprintf("Failed to get max order: %v", err)))
				return
			}

			value := models.DropdownValue{
				Value:      input.Value,
				OrderIndex: maxOrder + 1,
			}

			if err := db.DB.Create(&value).Error; err != nil {
				c.Error(utils.NewInternalError(fmt.Sprintf("Failed to create value: %v", err)))
				return
			}

			var values []models.DropdownValue
			if err := db.DB.Order("order_index asc").Find(&values, "table_name = ?", tableName).Error; err != nil {
				c.Error(utils.NewInternalError(fmt.Sprintf("Failed to get values: %v", err)))
				return
			}

			c.JSON(http.StatusOK, values)
			return
		}

		values, err := utils.ReadDropdownValues(filePath)
		if err != nil {
			c.Error(utils.NewInternalError(fmt.Sprintf("Failed to read values: %v", err)))
			return
		}

		// Check if value already exists
		for _, v := range values {
			if v.Value == input.Value {
				c.JSON(http.StatusOK, values)
				return
			}
		}

		maxOrder := -1
		for _, v := range values {
			if v.OrderIndex > maxOrder {
				maxOrder = v.OrderIndex
			}
		}

		values = append(values, models.DropdownValue{
			Value:      input.Value,
			OrderIndex: maxOrder + 1,
		})

		if err := utils.WriteDropdownValues(filePath, values); err != nil {
			c.Error(utils.NewInternalError(fmt.Sprintf("Failed to write values: %v", err)))
			return
		}

		c.JSON(http.StatusOK, values)
	}
}

func handleDeleteDropdownValue(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.Param("key")
		var input struct {
			Value string `json:"value" binding:"required"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.Error(utils.NewValidationError("Value is required"))
			return
		}

		var tableName string
		var filePath string
		switch key {
		case "origin_country", "main_impact_country":
			tableName = "countries"
			filePath = cfg.CSV.CountriesPath
		case "relevant_exchange":
			tableName = "exchanges"
			filePath = cfg.CSV.ExchangesPath
		case "event_type":
			tableName = "event_types"
			filePath = cfg.CSV.EventTypesPath
		default:
			c.Error(utils.NewValidationError("Invalid dropdown key"))
			return
		}

		if cfg.StorageType != "csv" {
			if err := db.DB.Where("table_name = ? AND value = ?", tableName, input.Value).Delete(&models.DropdownValue{}).Error; err != nil {
				c.Error(utils.NewInternalError(fmt.Sprintf("Failed to delete value: %v", err)))
				return
			}

			var values []models.DropdownValue
			if err := db.DB.Order("order_index asc").Find(&values, "table_name = ?", tableName).Error; err != nil {
				c.Error(utils.NewInternalError(fmt.Sprintf("Failed to get values: %v", err)))
				return
			}

			c.JSON(http.StatusOK, values)
			return
		}

		values, err := utils.ReadDropdownValues(filePath)
		if err != nil {
			c.Error(utils.NewInternalError(fmt.Sprintf("Failed to read values: %v", err)))
			return
		}

		found := false
		var newValues []models.DropdownValue
		for _, v := range values {
			if v.Value != input.Value {
				newValues = append(newValues, v)
			} else {
				found = true
			}
		}

		if !found {
			c.Error(utils.NewNotFoundError("Value not found"))
			return
		}

		if err := utils.WriteDropdownValues(filePath, newValues); err != nil {
			c.Error(utils.NewInternalError(fmt.Sprintf("Failed to write values: %v", err)))
			return
		}

		c.JSON(http.StatusOK, newValues)
	}
}

func handleReorderDropdownValues(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.Param("key")
		var input struct {
			Values []string `json:"values" binding:"required"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.Error(utils.NewValidationError("Values are required"))
			return
		}

		var tableName string
		var filePath string
		switch key {
		case "origin_country", "main_impact_country":
			tableName = "countries"
			filePath = cfg.CSV.CountriesPath
		case "relevant_exchange":
			tableName = "exchanges"
			filePath = cfg.CSV.ExchangesPath
		case "event_type":
			tableName = "event_types"
			filePath = cfg.CSV.EventTypesPath
		default:
			c.Error(utils.NewValidationError("Invalid dropdown key"))
			return
		}

		if cfg.StorageType != "csv" {
			tx := db.DB.Begin()
			for i, value := range input.Values {
				if err := tx.Model(&models.DropdownValue{}).Where("table_name = ? AND value = ?", tableName, value).Update("order_index", i).Error; err != nil {
					tx.Rollback()
					c.Error(utils.NewInternalError(fmt.Sprintf("Failed to update order: %v", err)))
					return
				}
			}
			tx.Commit()

			var values []models.DropdownValue
			if err := db.DB.Order("order_index asc").Find(&values, "table_name = ?", tableName).Error; err != nil {
				c.Error(utils.NewInternalError(fmt.Sprintf("Failed to get values: %v", err)))
				return
			}

			c.JSON(http.StatusOK, values)
			return
		}

		var newValues []models.DropdownValue
		for i, value := range input.Values {
			newValues = append(newValues, models.DropdownValue{
				Value:      value,
				OrderIndex: i,
			})
		}

		if err := utils.WriteDropdownValues(filePath, newValues); err != nil {
			c.Error(utils.NewInternalError(fmt.Sprintf("Failed to write values: %v", err)))
			return
		}

		c.JSON(http.StatusOK, newValues)
	}
}

func handleGetEvents(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		if cfg.StorageType != "csv" {
			var events []models.Event
			if err := db.DB.Order("created_at desc").Find(&events).Error; err != nil {
				c.Error(utils.NewInternalError(fmt.Sprintf("Failed to get events: %v", err)))
				return
			}
			c.JSON(http.StatusOK, events)
			return
		}

		events, err := utils.ReadCSV(cfg.CSV.EventsPath)
		if err != nil {
			c.Error(utils.NewInternalError(fmt.Sprintf("Failed to read events: %v", err)))
			return
		}
		c.JSON(http.StatusOK, events)
	}
}

func handleCreateEvent(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var event models.Event
		if err := c.ShouldBindJSON(&event); err != nil {
			c.Error(utils.NewValidationError("Invalid event data"))
			return
		}

		event.CreatedAt = time.Now()

		if cfg.StorageType != "csv" {
			if err := db.DB.Create(&event).Error; err != nil {
				c.Error(utils.NewInternalError(fmt.Sprintf("Failed to create event: %v", err)))
				return
			}
			c.JSON(http.StatusCreated, event)
			return
		}

		events, err := utils.ReadCSV(cfg.CSV.EventsPath)
		if err != nil {
			c.Error(utils.NewInternalError(fmt.Sprintf("Failed to read events: %v", err)))
			return
		}

		event.ID = len(events) + 1
		eventMap := make(map[string]interface{})
		eventMap["id"] = event.ID
		eventMap["event_name"] = event.EventName
		eventMap["event_type"] = event.EventType
		eventMap["origin_country"] = event.OriginCountry
		eventMap["main_impact_country"] = event.MainImpactCountry
		eventMap["relevant_exchange"] = event.RelevantExchange
		eventMap["month"] = event.Month
		eventMap["year"] = event.Year
		eventMap["description"] = event.Description
		eventMap["created_at"] = event.CreatedAt

		events = append(events, eventMap)
		if err := utils.WriteCSV(cfg.CSV.EventsPath, events); err != nil {
			c.Error(utils.NewInternalError(fmt.Sprintf("Failed to write events: %v", err)))
			return
		}

		c.JSON(http.StatusCreated, event)
	}
}

func getAPIDocumentation(cfg *config.Config) string {
	return fmt.Sprintf(`
	<html>
		<head><title>Go API Server Documentation</title></head>
		<body>
			<h1>Go API Server Documentation</h1>
			<h2>Available Endpoints:</h2>
			<ul>
				<li><strong>GET /</strong> - This API documentation</li>
				<li><strong>GET /entries</strong> - Retrieve all entries</li>
				<li><strong>POST /entries</strong> - Create a new entry</li>
				<li><strong>PUT /entries/:id</strong> - Update an entry by id</li>
				<li><strong>DELETE /entries/:id</strong> - Delete an entry by id</li>
				<li><strong>GET /dropdowns</strong> - Retrieve all dropdown lists</li>
				<li><strong>POST /dropdowns/:key</strong> - Add a new dropdown value for a given key</li>
				<li><strong>DELETE /dropdowns/:key</strong> - Remove a dropdown value for a given key</li>
				<li><strong>PUT /dropdowns/:key/reorder</strong> - Reorder dropdown values for a given key</li>
				<li><strong>POST /events</strong> - Create a new event</li>
				<li><strong>GET /events</strong> - Retrieve all events</li>
			</ul>
			<p>CSV File paths used:</p>
			<ul>
				<li>Data: %s</li>
				<li>Countries: %s</li>
				<li>Exchanges: %s</li>
				<li>Event Types: %s</li>
				<li>Events: %s</li>
			</ul>
		</body>
	</html>
	`, cfg.CSV.DataPath, cfg.CSV.CountriesPath, cfg.CSV.ExchangesPath, cfg.CSV.EventTypesPath, cfg.CSV.EventsPath)
}
