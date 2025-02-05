import streamlit as st
import pandas as pd
import plotly.express as px
from datetime import datetime
from services import EventService
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
if 'event_service' not in st.session_state:
    st.session_state.event_service = EventService()
if 'show_add_form' not in st.session_state:
    st.session_state.show_add_form = False
if 'show_edit_form' not in st.session_state:
    st.session_state.show_edit_form = False
if 'edit_event_id' not in st.session_state:
    st.session_state.edit_event_id = None

MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December']

def show_event_form(event_data=None):
    """Show form for adding/editing events"""
    service = st.session_state.event_service
    
    with st.form("event_form"):
        event_name = st.text_input("Event Name", value=event_data['event_name'] if event_data else "")
        
        # Event type dropdown
        event_types = service.get_event_types()
        default_event_type = event_data['event_type'] if event_data else event_types[0]
        event_type = st.selectbox("Event Type", event_types, 
                                index=event_types.index(default_event_type) if event_data else 0)
        
        # Origin country dropdown
        countries = service.get_countries()
        default_origin = event_data['origin_country'] if event_data else countries[0]
        origin_country = st.selectbox("Origin Country", countries,
                                    index=countries.index(default_origin) if event_data else 0)
        
        # Impact country dropdown
        default_impact = event_data['main_impact_country'] if event_data else countries[0]
        impact_country = st.selectbox("Main Impact Country", countries,
                                    index=countries.index(default_impact) if event_data else 0)
        
        # Exchange dropdown
        exchanges = service.get_exchanges()
        default_exchange = event_data['relevant_exchange'] if event_data else exchanges[0]
        exchange = st.selectbox("Relevant Exchange", exchanges,
                              index=exchanges.index(default_exchange) if event_data else 0)
        
        # Month dropdown
        month = st.selectbox("Month", MONTHS, 
                           index=MONTHS.index(event_data['month']) if event_data else 0)
        
        year = st.number_input("Year", min_value=2000, max_value=2100, 
                             value=int(event_data['year']) if event_data else datetime.now().year)
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
                if service.update_event(event_data['id'], new_event):
                    st.success("Event updated successfully!")
                    st.session_state.show_edit_form = False
                    st.session_state.edit_event_id = None
                    st.experimental_rerun()
            else:  # Adding new event
                if service.create_event(new_event):
                    st.success("Event added successfully!")
                    st.session_state.show_add_form = False
                    st.experimental_rerun()

def main():
    st.title("Events Dashboard 📊")
    
    service = st.session_state.event_service
    
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
            show_event_form()
        
        if st.session_state.show_edit_form and st.session_state.edit_event_id is not None:
            st.subheader("Edit Event")
            events_df = service.get_events()
            event_data = events_df[events_df['id'] == st.session_state.edit_event_id].iloc[0].to_dict()
            show_event_form(event_data)

        # Filters in a horizontal layout
        st.subheader("Filters")
        col1, col2, col3, col4 = st.columns(4)
        
        filters = {}
        with col1:
            # Country filter
            countries = ["All"] + service.get_countries()
            selected_country = st.selectbox("Select Origin Country", countries)
            if selected_country != "All":
                filters['origin_country'] = selected_country
        
        with col2:
            # Event type filter
            event_types = ["All"] + service.get_event_types()
            selected_event_type = st.selectbox("Select Event Type", event_types)
            if selected_event_type != "All":
                filters['event_type'] = selected_event_type
        
        with col3:
            # Month filter
            selected_month = st.selectbox("Select Month", ["All"] + MONTHS)
            if selected_month != "All":
                filters['month'] = selected_month
        
        with col4:
            # Year filter
            events_df = service.get_events()
            years = sorted(events_df['year'].unique())
            selected_year = st.selectbox("Select Year", ["All"] + list(years))
            if selected_year != "All":
                filters['year'] = selected_year
        
        # Get filtered events
        filtered_df = service.get_events(filters)
        
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
            height=600,
            column_config={
                "event_name": st.column_config.TextColumn(
                    "Event Name",
                    width="large",
                ),
                "event_type": st.column_config.SelectboxColumn(
                    "Event Type",
                    options=service.get_event_types(),
                    width="medium",
                ),
                "origin_country": st.column_config.SelectboxColumn(
                    "Origin Country",
                    options=service.get_countries(),
                    width="medium",
                ),
                "main_impact_country": st.column_config.SelectboxColumn(
                    "Impact Country",
                    options=service.get_countries(),
                    width="medium",
                ),
                "relevant_exchange": st.column_config.SelectboxColumn(
                    "Exchange",
                    options=service.get_exchanges(),
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
                    format="%d",
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
                success = True
                for index, row in filtered_df.iterrows():
                    edited_row = edited_df.iloc[index]
                    event_data = {col: edited_row[col] for col in display_columns}
                    if not service.update_event(row['id'], event_data):
                        success = False
                        break
                
                if success:
                    st.success("Changes saved successfully!")
                    st.experimental_rerun()
                else:
                    st.error("Error saving changes. Please try again.")
            except Exception as e:
                st.error(f"Error saving changes: {str(e)}")
    
    with tab2:
        # Get event statistics
        stats = service.get_event_stats()
        
        # Display metrics in a wider grid
        st.subheader("Key Metrics")
        col1, col2, col3, col4, col5, col6 = st.columns(6)
        with col1:
            st.metric("Total Events", stats.get('total_events', 0))
        with col2:
            st.metric("Total Origin Countries", stats.get('total_origin_countries', 0))
        with col3:
            st.metric("Total Impact Countries", stats.get('total_impact_countries', 0))
        with col4:
            st.metric("Total Event Types", stats.get('total_event_types', 0))
        with col5:
            st.metric("Total Exchanges", stats.get('total_exchanges', 0))
        with col6:
            st.metric("Events This Year", stats.get('events_this_year', 0))
        
        # Create visualizations
        st.subheader("Event Distribution")
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Events by origin country
            country_counts = filtered_df['origin_country'].value_counts().reset_index()
            fig_country = px.bar(
                country_counts,
                x='origin_country',
                y='count',
                title="Events by Origin Country"
            )
            st.plotly_chart(fig_country, use_container_width=True)
        
        with col2:
            # Events by type
            type_counts = filtered_df['event_type'].value_counts().reset_index()
            fig_type = px.pie(
                type_counts,
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