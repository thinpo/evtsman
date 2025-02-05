import os
import httpx
import pandas as pd
from typing import Dict, List, Optional
from datetime import datetime

class EventService:
    def __init__(self):
        self.backend_url = os.getenv('BACKEND_URL', 'http://localhost:8080')
        self.client = httpx.Client(timeout=30.0)

    def _handle_response(self, response: httpx.Response) -> dict:
        """Handle API response and errors"""
        response.raise_for_status()
        return response.json()

    def get_events(self, filters: Optional[Dict] = None) -> pd.DataFrame:
        """Get events with optional filters"""
        try:
            params = filters if filters else {}
            response = self.client.get(f"{self.backend_url}/api/events", params=params)
            data = self._handle_response(response)
            return pd.DataFrame(data)
        except Exception as e:
            print(f"Error fetching events: {str(e)}")
            return pd.DataFrame()

    def get_countries(self) -> List[str]:
        """Get list of countries"""
        try:
            response = self.client.get(f"{self.backend_url}/api/countries")
            data = self._handle_response(response)
            return [country['value'] for country in data]
        except Exception as e:
            print(f"Error fetching countries: {str(e)}")
            return []

    def get_event_types(self) -> List[str]:
        """Get list of event types"""
        try:
            response = self.client.get(f"{self.backend_url}/api/event-types")
            data = self._handle_response(response)
            return [event_type['value'] for event_type in data]
        except Exception as e:
            print(f"Error fetching event types: {str(e)}")
            return []

    def get_exchanges(self) -> List[str]:
        """Get list of exchanges"""
        try:
            response = self.client.get(f"{self.backend_url}/api/exchanges")
            data = self._handle_response(response)
            return [exchange['value'] for exchange in data]
        except Exception as e:
            print(f"Error fetching exchanges: {str(e)}")
            return []

    def create_event(self, event_data: Dict) -> bool:
        """Create a new event"""
        try:
            response = self.client.post(
                f"{self.backend_url}/api/events",
                json=event_data
            )
            self._handle_response(response)
            return True
        except Exception as e:
            print(f"Error creating event: {str(e)}")
            return False

    def update_event(self, event_id: int, event_data: Dict) -> bool:
        """Update an existing event"""
        try:
            response = self.client.put(
                f"{self.backend_url}/api/events/{event_id}",
                json=event_data
            )
            self._handle_response(response)
            return True
        except Exception as e:
            print(f"Error updating event: {str(e)}")
            return False

    def delete_event(self, event_id: int) -> bool:
        """Delete an event"""
        try:
            response = self.client.delete(f"{self.backend_url}/api/events/{event_id}")
            self._handle_response(response)
            return True
        except Exception as e:
            print(f"Error deleting event: {str(e)}")
            return False

    def get_event_stats(self) -> Dict:
        """Get event statistics"""
        try:
            response = self.client.get(f"{self.backend_url}/api/events/stats")
            return self._handle_response(response)
        except Exception as e:
            print(f"Error fetching event stats: {str(e)}")
            return {} 