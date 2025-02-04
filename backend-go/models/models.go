package models

import "time"

type Entry struct {
	ID                string    `json:"id" gorm:"primaryKey"`
	Date             string    `json:"date"`
	Month            string    `json:"month"`
	OriginCountry    string    `json:"origin_country"`
	MainImpactCountry string    `json:"main_impact_country"`
	RelevantExchange string    `json:"relevant_exchange"`
	EventType        string    `json:"event_type"`
	WhoInput         string    `json:"who_input"`
	WhenInput        time.Time `json:"when_input"`
	Details          string    `json:"details"`
}

type DropdownValue struct {
	Value      string `json:"value" gorm:"primaryKey"`
	OrderIndex int    `json:"order_index"`
}

type Event struct {
	ID                int       `json:"id" gorm:"primaryKey;autoIncrement"`
	EventName         string    `json:"event_name"`
	EventType         string    `json:"event_type"`
	OriginCountry     string    `json:"origin_country"`
	MainImpactCountry string    `json:"main_impact_country"`
	RelevantExchange  string    `json:"relevant_exchange"`
	Month             string    `json:"month"`
	Year              string    `json:"year"`
	Description       string    `json:"description"`
	CreatedAt         time.Time `json:"created_at" gorm:"autoCreateTime"`
} 