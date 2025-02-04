package utils

import (
	"encoding/csv"
	"events-api/models"
	"fmt"
	"os"
	"sort"
	"strconv"
	"time"
)

func ReadCSV(filePath string) ([]map[string]interface{}, error) {
	// Create file if it doesn't exist
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		file, err := os.Create(filePath)
		if err != nil {
			return nil, fmt.Errorf("failed to create CSV file: %v", err)
		}
		writer := csv.NewWriter(file)
		writer.Write([]string{"value", "order_index"})
		writer.Flush()
		file.Close()
	}

	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open CSV file: %v", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to read CSV file: %v", err)
	}

	if len(records) == 0 {
		return []map[string]interface{}{}, nil
	}

	headers := records[0]
	var result []map[string]interface{}

	for _, record := range records[1:] {
		item := make(map[string]interface{})
		for i, value := range record {
			if headers[i] == "order_index" {
				orderIndex, _ := strconv.Atoi(value)
				item[headers[i]] = orderIndex
			} else {
				item[headers[i]] = value
			}
		}
		result = append(result, item)
	}

	return result, nil
}

func WriteCSV(filePath string, data []map[string]interface{}) error {
	file, err := os.Create(filePath)
	if err != nil {
		return fmt.Errorf("failed to create CSV file: %v", err)
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// Write headers
	var headers []string
	if len(data) > 0 {
		for k := range data[0] {
			headers = append(headers, k)
		}
		sort.Strings(headers)
		if err := writer.Write(headers); err != nil {
			return fmt.Errorf("failed to write CSV headers: %v", err)
		}
	} else {
		if err := writer.Write([]string{"value", "order_index"}); err != nil {
			return fmt.Errorf("failed to write CSV headers: %v", err)
		}
		return nil
	}

	// Write data
	for _, item := range data {
		var record []string
		for _, h := range headers {
			var value string
			switch v := item[h].(type) {
			case string:
				value = v
			case int:
				value = strconv.Itoa(v)
			case time.Time:
				value = v.Format(time.RFC3339)
			default:
				value = fmt.Sprintf("%v", v)
			}
			record = append(record, value)
		}
		if err := writer.Write(record); err != nil {
			return fmt.Errorf("failed to write CSV record: %v", err)
		}
	}

	return nil
}

func ReadDropdownValues(filePath string) ([]models.DropdownValue, error) {
	data, err := ReadCSV(filePath)
	if err != nil {
		return nil, err
	}

	var values []models.DropdownValue
	for _, item := range data {
		value := models.DropdownValue{
			Value:      item["value"].(string),
			OrderIndex: item["order_index"].(int),
		}
		values = append(values, value)
	}

	sort.Slice(values, func(i, j int) bool {
		return values[i].OrderIndex < values[j].OrderIndex
	})

	return values, nil
}

func WriteDropdownValues(filePath string, values []models.DropdownValue) error {
	var data []map[string]interface{}
	for _, value := range values {
		data = append(data, map[string]interface{}{
			"value":       value.Value,
			"order_index": value.OrderIndex,
		})
	}
	return WriteCSV(filePath, data)
}
