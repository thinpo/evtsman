import streamlit as st
import pandas as pd
import plotly.express as px
from pathlib import Path
import datetime
import csv
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set page config
st.set_page_config(
    page_title="Events Dashboard",
    page_icon="📊",
    layout="wide"
)

# Initialize session state
if 'data' not in st.session_state:
    st.session_state.data = None
if 'show_add_form' not in st.session_state:
    st.session_state.show_add_form = False
if 'show_edit_form' not in st.session_state:
    st.session_state.show_edit_form = False
if 'edit_event_id' not in st.session_state:
    st.session_state.edit_event_id = None

# Get file paths from environment variables
EVENTS_FILE = os.getenv('EVENTS_FILE', './data/events.csv')
COUNTRIES_FILE = os.getenv('COUNTRIES_FILE', './data/countries.csv')
EVENT_TYPES_FILE = os.getenv('EVENT_TYPES_FILE', './data/event_types.csv')
EXCHANGES_FILE = os.getenv('EXCHANGES_FILE', './data/exchanges.csv')

MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December']

def load_data():
    """Load data from CSV files"""
    try:
        events_df = pd.read_csv(EVENTS_FILE)
        countries_df = pd.read_csv(COUNTRIES_FILE)
        event_types_df = pd.read_csv(EVENT_TYPES_FILE)
        exchanges_df = pd.read_csv(EXCHANGES_FILE)
        return events_df, countries_df, event_types_df, exchanges_df
    except Exception as e:
        st.error(f"Error loading data: {str(e)}")
        return None, None, None, None

def save_event(event_data, is_edit=False):
    """Save event to CSV file"""
    try:
        events_df = pd.read_csv(EVENTS_FILE)
        
        if is_edit:
            # Update existing event
            events_df.loc[events_df['id'] == event_data['id']] = event_data
        else:
            # Add new event
            event_data['id'] = len(events_df) + 1
            event_data['created_at'] = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
            events_df = pd.concat([events_df, pd.DataFrame([event_data])], ignore_index=True)
        
        events_df.to_csv(EVENTS_FILE, index=False)
        return True
    except Exception as e:
        st.error(f"Error saving event: {str(e)}")
        return False

def delete_event(event_id):
    """Delete event from CSV file"""
    try:
        events_df = pd.read_csv(EVENTS_FILE)
        events_df = events_df[events_df['id'] != event_id]
        events_df.to_csv(EVENTS_FILE, index=False)
        return True
    except Exception as e:
        st.error(f"Error deleting event: {str(e)}")
        return False

def show_event_form(events_df=None, event_data=None):
    """Show form for adding/editing events"""
    # Load reference data for dropdowns
    _, countries_df, event_types_df, exchanges_df = load_data()
    
    with st.form("event_form"):
        event_name = st.text_input("Event Name", value=event_data['event_name'] if event_data else "")
        
        # Event type dropdown
        event_types = sorted(event_types_df['value'].unique())
        default_event_type = event_data['event_type'] if event_data else event_types[0]
        event_type = st.selectbox("Event Type", event_types, 
                                index=event_types.index(default_event_type) if event_data else 0)
        
        # Origin country dropdown
        countries = sorted(countries_df['value'].unique())
        default_origin = event_data['origin_country'] if event_data else countries[0]
        origin_country = st.selectbox("Origin Country", countries,
                                    index=countries.index(default_origin) if event_data else 0)
        
        # Impact country dropdown
        default_impact = event_data['main_impact_country'] if event_data else countries[0]
        impact_country = st.selectbox("Main Impact Country", countries,
                                    index=countries.index(default_impact) if event_data else 0)
        
        # Exchange dropdown
        exchanges = sorted(exchanges_df['value'].unique())
        default_exchange = event_data['relevant_exchange'] if event_data else exchanges[0]
        exchange = st.selectbox("Relevant Exchange", exchanges,
                              index=exchanges.index(default_exchange) if event_data else 0)
        
        # Month dropdown (already implemented)
        month = st.selectbox("Month", MONTHS, 
                           index=MONTHS.index(event_data['month']) if event_data else 0)
        
        year = st.number_input("Year", min_value=2000, max_value=2100, 
                             value=int(event_data['year']) if event_data else 2024)
        description = st.text_area("Description", 
                                 value=event_data['description'] if event_data else "")
        
        submitted = st.form_submit_button("Save Event")
        
        if submitted:
            new_event = {
                'event_name': event_name,
                'event_type': event_type,
                'origin_country': origin_country,
                'main_impact_country': impact_country,
                'relevant_exchange': exchange,
                'month': month,
                'year': year,
                'description': description
            }
            
            if event_data:  # Editing existing event
                new_event['id'] = event_data['id']
                new_event['created_at'] = event_data['created_at']
                if save_event(new_event, is_edit=True):
                    st.success("Event updated successfully!")
                    st.session_state.show_edit_form = False
                    st.session_state.edit_event_id = None
                    st.experimental_rerun()
            else:  # Adding new event
                if save_event(new_event):
                    st.success("Event added successfully!")
                    st.session_state.show_add_form = False
                    st.experimental_rerun()

def main():
    st.title("Events Dashboard 📊")
    
    # Load data
    events_df, countries_df, event_types_df, exchanges_df = load_data()
    
    if events_df is None:
        st.error("Failed to load data. Please check the data files.")
        return

    # Create tabs
    tab1, tab2 = st.tabs(["📝 Events Manager", "📊 Analytics"])
    
    with tab1:
        # Add Event button
        if st.button("➕ Add New Event"):
            st.session_state.show_add_form = True
            st.session_state.show_edit_form = False
        
        # Show add/edit forms
        if st.session_state.show_add_form:
            st.subheader("Add New Event")
            show_event_form(events_df)
        
        if st.session_state.show_edit_form and st.session_state.edit_event_id is not None:
            st.subheader("Edit Event")
            event_data = events_df[events_df['id'] == st.session_state.edit_event_id].iloc[0].to_dict()
            show_event_form(events_df, event_data)

        # Filters in a horizontal layout
        st.subheader("Filters")
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            # Country filter (using origin_country)
            countries = sorted(events_df['origin_country'].unique())
            selected_country = st.selectbox("Select Origin Country", ["All"] + countries)
        with col2:
            # Event type filter
            event_types = sorted(events_df['event_type'].unique())
            selected_event_type = st.selectbox("Select Event Type", ["All"] + event_types)
        with col3:
            # Month filter
            selected_month = st.selectbox("Select Month", ["All"] + MONTHS)
        with col4:
            # Year filter
            years = sorted(events_df['year'].unique())
            selected_year = st.selectbox("Select Year", ["All"] + list(years))
        
        # Filter data
        filtered_df = events_df.copy()
        if selected_country != "All":
            filtered_df = filtered_df[filtered_df['origin_country'] == selected_country]
        if selected_event_type != "All":
            filtered_df = filtered_df[filtered_df['event_type'] == selected_event_type]
        if selected_month != "All":
            filtered_df = filtered_df[filtered_df['month'] == selected_month]
        if selected_year != "All":
            filtered_df = filtered_df[filtered_df['year'] == selected_year]
        
        # Display data in an editable table format
        st.subheader("Events Table")
        
        # Prepare display columns
        display_columns = ['event_name', 'event_type', 'origin_country', 'main_impact_country', 
                         'relevant_exchange', 'month', 'year', 'description']
        
        # Create an editable dataframe with more height
        edited_df = st.data_editor(
            filtered_df[display_columns],
            use_container_width=True,
            num_rows="dynamic",
            height=600,  # Increased height
            column_config={
                "event_name": st.column_config.TextColumn(
                    "Event Name",
                    width="large",
                ),
                "event_type": st.column_config.SelectboxColumn(
                    "Event Type",
                    options=sorted(event_types_df['value'].unique()),
                    width="medium",
                ),
                "origin_country": st.column_config.SelectboxColumn(
                    "Origin Country",
                    options=sorted(countries_df['value'].unique()),
                    width="medium",
                ),
                "main_impact_country": st.column_config.SelectboxColumn(
                    "Impact Country",
                    options=sorted(countries_df['value'].unique()),
                    width="medium",
                ),
                "relevant_exchange": st.column_config.SelectboxColumn(
                    "Exchange",
                    options=sorted(exchanges_df['value'].unique()),
                    width="medium",
                ),
                "month": st.column_config.SelectboxColumn(
                    "Month",
                    options=MONTHS,
                    width="medium",
                ),
                "year": st.column_config.NumberColumn(
                    "Year",
                    min_value=2000,
                    max_value=2100,
                    width="small",
                    format="%d",  # This will display the year without thousands separator
                ),
                "description": st.column_config.TextColumn(
                    "Description",
                    width="large",
                ),
            },
            hide_index=True,
        )
        
        # Add save button for table changes
        if st.button("💾 Save Changes"):
            try:
                # Update the original dataframe with edited values
                for index, row in filtered_df.iterrows():
                    edited_row = edited_df.iloc[index]
                    for col in display_columns:
                        events_df.at[index, col] = edited_row[col]
                
                # Save to CSV
                events_df.to_csv(EVENTS_FILE, index=False)
                st.success("Changes saved successfully!")
                st.experimental_rerun()
            except Exception as e:
                st.error(f"Error saving changes: {str(e)}")
    
    with tab2:
        # Display metrics in a wider grid
        st.subheader("Key Metrics")
        col1, col2, col3, col4, col5, col6 = st.columns(6)
        with col1:
            st.metric("Total Events", len(filtered_df))
        with col2:
            st.metric("Total Origin Countries", len(filtered_df['origin_country'].unique()))
        with col3:
            st.metric("Total Impact Countries", len(filtered_df['main_impact_country'].unique()))
        with col4:
            st.metric("Total Event Types", len(filtered_df['event_type'].unique()))
        with col5:
            st.metric("Total Exchanges", len(filtered_df['relevant_exchange'].unique()))
        with col6:
            current_year = datetime.datetime.now().year
            st.metric("Events This Year", len(filtered_df[filtered_df['year'] == current_year]))
        
        # Create visualizations
        st.subheader("Event Distribution")
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Events by origin country
            fig_country = px.bar(
                filtered_df['origin_country'].value_counts().reset_index(),
                x='origin_country',
                y='count',
                title="Events by Origin Country"
            )
            st.plotly_chart(fig_country, use_container_width=True)
        
        with col2:
            # Events by type
            fig_type = px.pie(
                filtered_df['event_type'].value_counts().reset_index(),
                names='event_type',
                values='count',
                title="Events by Type"
            )
            st.plotly_chart(fig_type, use_container_width=True)
        
        # Timeline view
        st.subheader("Events Timeline")
        timeline_df = filtered_df.copy()
        timeline_df['date'] = pd.to_datetime(timeline_df['year'].astype(str) + '-' + 
                                           timeline_df['month'].map(lambda x: {
                                               'January': '01', 'February': '02', 'March': '03',
                                               'April': '04', 'May': '05', 'June': '06',
                                               'July': '07', 'August': '08', 'September': '09',
                                               'October': '10', 'November': '11', 'December': '12'
                                           }.get(x, '01')) + '-01')
        
        fig_timeline = px.scatter(
            timeline_df,
            x='date',
            y='event_type',
            color='origin_country',
            hover_data=['event_name', 'description'],
            title="Events Timeline"
        )
        st.plotly_chart(fig_timeline, use_container_width=True)
        
        # Additional statistics
        st.subheader("Event Statistics")
        col1, col2 = st.columns(2)
        
        with col1:
            # Events per year
            yearly_events = filtered_df['year'].value_counts().sort_index()
            fig_yearly = px.line(
                x=yearly_events.index,
                y=yearly_events.values,
                title="Events per Year",
                labels={'x': 'Year', 'y': 'Number of Events'}
            )
            st.plotly_chart(fig_yearly, use_container_width=True)
        
        with col2:
            # Events per month
            monthly_events = filtered_df['month'].value_counts()
            # Reorder months
            monthly_events = monthly_events.reindex(MONTHS)
            fig_monthly = px.bar(
                x=monthly_events.index,
                y=monthly_events.values,
                title="Events per Month",
                labels={'x': 'Month', 'y': 'Number of Events'}
            )
            st.plotly_chart(fig_monthly, use_container_width=True)

if __name__ == "__main__":
    main() 