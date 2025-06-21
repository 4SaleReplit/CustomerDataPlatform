# Comprehensive Amplitude Event Tracking Guide
## Customer Data Platform - User Stories & Analytics Implementation

This document provides a complete mapping of all user interactions, screens, and events for Amplitude analytics implementation across the Customer Data Platform.

---

## 📊 Dashboard Screen (`/`)

### Screen: Main Dashboard
**Screen Name:** `Dashboard`
**Description:** Primary analytics dashboard with customizable tiles and metrics

#### User Stories & Events:

1. **View Dashboard**
   - **Event:** `Screen Viewed`
   - **Properties:** `screen_name: "Dashboard"`, `tile_count: number`, `user_type: string`

2. **Add New Tile**
   - **Element:** Button "Add Tile"
   - **Event:** `Add Tile Button Clicked`
   - **Endpoint:** `POST /api/dashboard/tiles`
   - **Properties:** `tile_type: string`, `position_x: number`, `position_y: number`

3. **Refresh All Tiles**
   - **Element:** Button "Refresh All"
   - **Event:** `Refresh All Tiles Clicked`
   - **Endpoint:** `POST /api/dashboard/tiles/refresh-all`
   - **Properties:** `total_tiles: number`, `refresh_duration: number`

4. **Edit Tile**
   - **Element:** Tile edit icon
   - **Event:** `Tile Edit Clicked`
   - **Properties:** `tile_id: string`, `tile_type: string`, `tile_title: string`

5. **Delete Tile**
   - **Element:** Tile delete button
   - **Event:** `Tile Delete Clicked`
   - **Endpoint:** `DELETE /api/dashboard/tiles/:id`
   - **Properties:** `tile_id: string`, `tile_type: string`

6. **Move/Resize Tile**
   - **Element:** Drag handle
   - **Event:** `Tile Layout Changed`
   - **Properties:** `tile_id: string`, `new_x: number`, `new_y: number`, `new_width: number`, `new_height: number`

7. **Toggle Edit Mode**
   - **Element:** Button "Edit Layout"
   - **Event:** `Edit Mode Toggled`
   - **Properties:** `edit_mode: boolean`

8. **Save Layout**
   - **Element:** Button "Save Layout"
   - **Event:** `Layout Saved`
   - **Endpoint:** `PATCH /api/dashboard/tiles/layout`
   - **Properties:** `tiles_modified: number`

---

## 👥 Users Screen (`/users`)

### Screen: User Management
**Screen Name:** `Users`
**Description:** User data analytics and management interface

#### User Stories & Events:

1. **View Users Screen**
   - **Event:** `Screen Viewed`
   - **Properties:** `screen_name: "Users"`, `total_users: number`, `displayed_users: number`

2. **Search Users**
   - **Element:** Search input field
   - **Event:** `User Search Performed`
   - **Properties:** `search_term: string`, `search_type: "name|email|id"`, `results_count: number`

3. **Filter Users by Type**
   - **Element:** Filter dropdown "User Type"
   - **Event:** `User Filter Applied`
   - **Properties:** `filter_type: "user_type"`, `filter_value: string`, `results_count: number`

4. **Filter Users by Status**
   - **Element:** Filter dropdown "Status"
   - **Event:** `User Filter Applied`
   - **Properties:** `filter_type: "status"`, `filter_value: string`, `results_count: number`

5. **Search with User ID**
   - **Element:** Button "Search with ID"
   - **Event:** `User ID Search Clicked`
   - **Endpoint:** `GET /api/users/search/:id`
   - **Properties:** `user_id: string`, `found: boolean`

6. **Refresh Users Data**
   - **Element:** Button "Refresh"
   - **Event:** `Users Refresh Clicked`
   - **Endpoint:** `GET /api/users/all`
   - **Properties:** `refresh_duration: number`

7. **View User Details**
   - **Element:** User row click
   - **Event:** `User Details Viewed`
   - **Properties:** `user_id: string`, `user_type: string`, `credits_spent: number`

8. **Pagination Navigation**
   - **Element:** Pagination buttons
   - **Event:** `Users Page Changed`
   - **Properties:** `page_number: number`, `items_per_page: number`, `total_pages: number`

---

## 🎯 Segments Screen (`/segments`)

### Screen: User Segmentation
**Screen Name:** `Segments`
**Description:** User segment creation and management

#### User Stories & Events:

1. **View Segments Screen**
   - **Event:** `Screen Viewed`
   - **Properties:** `screen_name: "Segments"`, `total_segments: number`

2. **Create New Segment**
   - **Element:** Button "Create Segment"
   - **Event:** `Create Segment Button Clicked`
   - **Properties:** `segment_count: number`

3. **Define Segment Criteria**
   - **Element:** Segment form fields
   - **Event:** `Segment Criteria Defined`
   - **Properties:** `attribute: string`, `operator: string`, `value: string`

4. **Save Segment**
   - **Element:** Button "Save Segment"
   - **Event:** `Segment Created`
   - **Endpoint:** `POST /api/segments`
   - **Properties:** `segment_name: string`, `attribute: string`, `operator: string`, `estimated_size: number`

5. **Edit Segment**
   - **Element:** Segment edit button
   - **Event:** `Segment Edit Clicked`
   - **Properties:** `segment_id: string`, `segment_name: string`, `current_size: number`

6. **Delete Segment**
   - **Element:** Segment delete button
   - **Event:** `Segment Delete Clicked`
   - **Endpoint:** `DELETE /api/segments/:id`
   - **Properties:** `segment_id: string`, `segment_name: string`

7. **Search Segments**
   - **Element:** Search input
   - **Event:** `Segment Search Performed`
   - **Properties:** `search_term: string`, `results_count: number`

8. **Filter by Status**
   - **Element:** Status filter dropdown
   - **Event:** `Segment Filter Applied`
   - **Properties:** `filter_value: string`, `results_count: number`

---

## 👥 Cohorts Screen (`/cohorts`)

### Screen: Cohort Management
**Screen Name:** `Cohorts`
**Description:** User cohort creation and campaign management

#### User Stories & Events:

1. **View Cohorts Screen**
   - **Event:** `Screen Viewed`
   - **Properties:** `screen_name: "Cohorts"`, `total_cohorts: number`

2. **Create New Cohort**
   - **Element:** Button "Create Cohort"
   - **Event:** `Create Cohort Button Clicked`

3. **Build Cohort**
   - **Element:** Cohort builder form
   - **Event:** `Cohort Built`
   - **Endpoint:** `POST /api/cohorts`
   - **Properties:** `cohort_name: string`, `segment_count: number`, `estimated_users: number`

4. **Edit Cohort**
   - **Element:** Cohort edit button
   - **Event:** `Cohort Edit Clicked`
   - **Properties:** `cohort_id: string`, `cohort_name: string`, `user_count: number`

5. **Sync to External Platform**
   - **Element:** Sync button
   - **Event:** `Cohort Sync Initiated`
   - **Endpoint:** `POST /api/cohorts/:id/sync`
   - **Properties:** `cohort_id: string`, `platform: string`, `user_count: number`

6. **View Cohort Details**
   - **Element:** Cohort name link
   - **Event:** `Cohort Details Viewed`
   - **Properties:** `cohort_id: string`, `cohort_size: number`, `sync_status: string`

---

## 📧 Campaigns Screen (`/campaigns`)

### Screen: Campaign Management
**Screen Name:** `Campaigns`
**Description:** Marketing campaign creation and management

#### User Stories & Events:

1. **View Campaigns Screen**
   - **Event:** `Screen Viewed`
   - **Properties:** `screen_name: "Campaigns"`, `total_campaigns: number`

2. **Create New Campaign**
   - **Element:** Button "Create Campaign"
   - **Event:** `Create Campaign Button Clicked`

3. **Configure Campaign**
   - **Element:** Campaign form
   - **Event:** `Campaign Configured`
   - **Properties:** `campaign_name: string`, `cohort_id: string`, `upsell_items: number`

4. **Launch Campaign**
   - **Element:** Button "Launch Campaign"
   - **Event:** `Campaign Launched`
   - **Endpoint:** `POST /api/campaigns/:id/launch`
   - **Properties:** `campaign_id: string`, `target_users: number`, `upsell_value: number`

5. **Pause/Resume Campaign**
   - **Element:** Status toggle
   - **Event:** `Campaign Status Changed`
   - **Endpoint:** `PATCH /api/campaigns/:id/status`
   - **Properties:** `campaign_id: string`, `new_status: string`, `previous_status: string`

---

## 📊 Data Studio Landing (`/data-studio`)

### Screen: Data Studio Hub
**Screen Name:** `Data Studio`
**Description:** Central hub for all data analysis tools

#### User Stories & Events:

1. **View Data Studio Hub**
   - **Event:** `Screen Viewed`
   - **Properties:** `screen_name: "Data Studio"`

2. **Navigate to Dashboards**
   - **Element:** Card "Dashboards"
   - **Event:** `Data Studio Feature Clicked`
   - **Properties:** `feature: "Dashboards"`

3. **Navigate to Explores**
   - **Element:** Card "Explores"
   - **Event:** `Data Studio Feature Clicked`
   - **Properties:** `feature: "Explores"`

4. **Navigate to SQL Editor**
   - **Element:** Card "SQL Editor"
   - **Event:** `Data Studio Feature Clicked`
   - **Properties:** `feature: "SQL Editor"`

5. **Navigate to File System**
   - **Element:** Card "File System"
   - **Event:** `Data Studio Feature Clicked`
   - **Properties:** `feature: "File System"`

6. **Navigate to Lineage**
   - **Element:** Card "Lineage"
   - **Event:** `Data Studio Feature Clicked`
   - **Properties:** `feature: "Lineage"`

7. **Navigate to Data Explorer**
   - **Element:** Card "Data Explorer"
   - **Event:** `Data Studio Feature Clicked`
   - **Properties:** `feature: "Data Explorer"`

---

## 📊 Data Studio Dashboards (`/data-studio/dashboards`)

### Screen: Dashboard Management
**Screen Name:** `Data Studio Dashboards`
**Description:** Advanced dashboard creation and management

#### User Stories & Events:

1. **View Dashboards Screen**
   - **Event:** `Screen Viewed`
   - **Properties:** `screen_name: "Data Studio Dashboards"`

2. **Create New Dashboard**
   - **Element:** Button "New Dashboard"
   - **Event:** `New Dashboard Button Clicked`

3. **Clone Dashboard**
   - **Element:** Button "Clone"
   - **Event:** `Dashboard Clone Clicked`
   - **Properties:** `source_dashboard_id: string`, `tile_count: number`

4. **Edit Dashboard**
   - **Element:** Edit button
   - **Event:** `Dashboard Edit Clicked`
   - **Properties:** `dashboard_id: string`, `dashboard_name: string`

5. **Delete Dashboard**
   - **Element:** Delete button
   - **Event:** `Dashboard Delete Clicked`
   - **Properties:** `dashboard_id: string`, `dashboard_name: string`

---

## 🔍 Data Studio Explores (`/data-studio/explores`)

### Screen: Data Exploration
**Screen Name:** `Data Studio Explores`
**Description:** Interactive data exploration and visualization

#### User Stories & Events:

1. **View Explores Screen**
   - **Event:** `Screen Viewed`
   - **Properties:** `screen_name: "Data Studio Explores"`, `total_explores: number`

2. **Create New Explore**
   - **Element:** Button "New Explore"
   - **Event:** `New Explore Button Clicked`

3. **Run Explore Query**
   - **Element:** Button "Run Query"
   - **Event:** `Explore Query Executed`
   - **Endpoint:** `POST /api/explores/:id/run`
   - **Properties:** `explore_id: string`, `query_type: string`, `execution_time: number`

4. **Save Explore**
   - **Element:** Button "Save Explore"
   - **Event:** `Explore Saved`
   - **Endpoint:** `POST /api/explores`
   - **Properties:** `explore_name: string`, `chart_type: string`, `data_source: string`

5. **Share Explore**
   - **Element:** Share button
   - **Event:** `Explore Shared`
   - **Properties:** `explore_id: string`, `share_method: string`

---

## 💻 SQL Editor (`/data-studio/sql`)

### Screen: SQL Query Interface
**Screen Name:** `SQL Editor`
**Description:** Advanced SQL editor with syntax highlighting

#### User Stories & Events:

1. **View SQL Editor**
   - **Event:** `Screen Viewed`
   - **Properties:** `screen_name: "SQL Editor"`

2. **Write SQL Query**
   - **Element:** Code editor
   - **Event:** `SQL Query Written`
   - **Properties:** `query_length: number`, `query_type: string`

3. **Execute Query**
   - **Element:** Button "Run Query"
   - **Event:** `SQL Query Executed`
   - **Endpoint:** `POST /api/sql/execute`
   - **Properties:** `query_type: string`, `execution_time: number`, `rows_returned: number`

4. **Save Query**
   - **Element:** Button "Save Query"
   - **Event:** `SQL Query Saved`
   - **Properties:** `query_name: string`, `query_type: string`

5. **Format Query**
   - **Element:** Button "Format"
   - **Event:** `SQL Query Formatted`
   - **Properties:** `original_length: number`, `formatted_length: number`

6. **Export Results**
   - **Element:** Export button
   - **Event:** `Query Results Exported`
   - **Properties:** `export_format: string`, `row_count: number`

---

## 📁 File System (`/data-studio/files`)

### Screen: File Management
**Screen Name:** `File System`
**Description:** File organization and management interface

#### User Stories & Events:

1. **View File System**
   - **Event:** `Screen Viewed`
   - **Properties:** `screen_name: "File System"`, `total_files: number`

2. **Create Folder**
   - **Element:** Button "New Folder"
   - **Event:** `Folder Created`
   - **Properties:** `folder_name: string`, `parent_path: string`

3. **Upload File**
   - **Element:** Upload button
   - **Event:** `File Uploaded`
   - **Endpoint:** `POST /api/files/upload`
   - **Properties:** `file_type: string`, `file_size: number`, `upload_duration: number`

4. **Move File**
   - **Element:** Drag and drop
   - **Event:** `File Moved`
   - **Properties:** `file_id: string`, `source_path: string`, `destination_path: string`

5. **Delete File**
   - **Element:** Delete button
   - **Event:** `File Deleted`
   - **Properties:** `file_id: string`, `file_type: string`, `file_size: number`

---

## 🔗 Lineage (`/data-studio/lineage`)

### Screen: Data Lineage
**Screen Name:** `Data Lineage`
**Description:** Data flow and dependency visualization

#### User Stories & Events:

1. **View Lineage Screen**
   - **Event:** `Screen Viewed`
   - **Properties:** `screen_name: "Data Lineage"`

2. **Search Lineage**
   - **Element:** Search input
   - **Event:** `Lineage Search Performed`
   - **Properties:** `search_term: string`, `entity_type: string`

3. **View Entity Details**
   - **Element:** Entity node click
   - **Event:** `Lineage Entity Viewed`
   - **Properties:** `entity_id: string`, `entity_type: string`, `dependency_count: number`

---

## 🕵️ Data Explorer (`/data-studio/explorer`)

### Screen: Data Discovery
**Screen Name:** `Data Explorer`
**Description:** Schema browsing and data discovery

#### User Stories & Events:

1. **View Data Explorer**
   - **Event:** `Screen Viewed`
   - **Properties:** `screen_name: "Data Explorer"`

2. **Browse Schema**
   - **Element:** Schema tree
   - **Event:** `Schema Browsed`
   - **Properties:** `database: string`, `schema: string`, `table_count: number`

3. **Preview Table Data**
   - **Element:** Table name click
   - **Event:** `Table Preview Opened`
   - **Endpoint:** `GET /api/data-explorer/preview/:table`
   - **Properties:** `table_name: string`, `row_count: number`, `column_count: number`

---

## 📊 Reports Landing (`/reports`)

### Screen: Reports Hub
**Screen Name:** `Reports`
**Description:** Report management and creation hub

#### User Stories & Events:

1. **View Reports Screen**
   - **Event:** `Screen Viewed`
   - **Properties:** `screen_name: "Reports"`, `total_reports: number`

2. **Create New Report**
   - **Element:** Button "New Report"
   - **Event:** `New Report Button Clicked`

3. **View Report**
   - **Element:** Report card click
   - **Event:** `Report Viewed`
   - **Properties:** `report_id: string`, `report_name: string`, `slide_count: number`

4. **Download Report PDF**
   - **Element:** Download button
   - **Event:** `Report PDF Downloaded`
   - **Endpoint:** `GET /api/reports/pdf/:id`
   - **Properties:** `report_id: string`, `file_size: number`

5. **Delete Report**
   - **Element:** Delete button
   - **Event:** `Report Deleted`
   - **Endpoint:** `DELETE /api/presentations/:id`
   - **Properties:** `report_id: string`, `report_name: string`

6. **Search Reports**
   - **Element:** Search input
   - **Event:** `Report Search Performed`
   - **Properties:** `search_term: string`, `results_count: number`

---

## 🎨 Design Studio (`/reports/designer`)

### Screen: Report Designer
**Screen Name:** `Design Studio`
**Description:** Visual report and presentation builder

#### User Stories & Events:

1. **View Design Studio**
   - **Event:** `Screen Viewed`
   - **Properties:** `screen_name: "Design Studio"`

2. **Add Slide**
   - **Element:** Button "Add Slide"
   - **Event:** `Slide Added`
   - **Properties:** `slide_position: number`, `template_type: string`

3. **Edit Slide Content**
   - **Element:** Slide editor
   - **Event:** `Slide Content Edited`
   - **Properties:** `slide_id: string`, `content_type: string`, `edit_duration: number`

4. **Upload Image**
   - **Element:** Image upload
   - **Event:** `Image Uploaded to Slide`
   - **Endpoint:** `POST /api/upload`
   - **Properties:** `slide_id: string`, `image_size: number`, `image_format: string`

5. **Save Presentation**
   - **Element:** Button "Save"
   - **Event:** `Presentation Saved`
   - **Endpoint:** `POST /api/presentations`
   - **Properties:** `presentation_name: string`, `slide_count: number`, `save_duration: number`

6. **Preview Presentation**
   - **Element:** Button "Preview"
   - **Event:** `Presentation Previewed`
   - **Properties:** `presentation_id: string`, `slide_count: number`

---

## 📧 Email Sender (`/reports/scheduler`)

### Screen: Email Campaign Management
**Screen Name:** `Email Sender`
**Description:** Email campaign creation and scheduling

#### User Stories & Events:

1. **View Email Sender**
   - **Event:** `Screen Viewed`
   - **Properties:** `screen_name: "Email Sender"`, `total_campaigns: number`

2. **Create One-Time Email**
   - **Element:** Button "Send Now"
   - **Event:** `One Time Email Created`

3. **Schedule Email**
   - **Element:** Button "Schedule Email"
   - **Event:** `Email Scheduled`
   - **Endpoint:** `POST /api/scheduled-reports-new`
   - **Properties:** `schedule_frequency: string`, `recipient_count: number`, `template_id: string`

4. **Send Immediate Email**
   - **Element:** Button "Send Now"
   - **Event:** `Email Sent Immediately`
   - **Endpoint:** `POST /api/email/send`
   - **Properties:** `recipient_count: number`, `template_id: string`, `subject: string`

5. **Edit Scheduled Email**
   - **Element:** Edit button
   - **Event:** `Scheduled Email Edited`
   - **Properties:** `email_id: string`, `schedule_type: string`

6. **Pause/Resume Email**
   - **Element:** Status toggle
   - **Event:** `Email Schedule Status Changed`
   - **Properties:** `email_id: string`, `new_status: string`

7. **Delete Email Campaign**
   - **Element:** Delete button
   - **Event:** `Email Campaign Deleted`
   - **Properties:** `email_id: string`, `campaign_type: string`

---

## 🎨 Email Templates (`/reports/email-templates`)

### Screen: Email Template Designer
**Screen Name:** `Email Templates Designer`
**Description:** HTML email template creation and editing

#### User Stories & Events:

1. **View Email Templates**
   - **Event:** `Screen Viewed`
   - **Properties:** `screen_name: "Email Templates Designer"`, `total_templates: number`

2. **Create New Template**
   - **Element:** Button "New Template"
   - **Event:** `Email Template Created`
   - **Properties:** `template_type: string`

3. **Edit Template**
   - **Element:** Template editor
   - **Event:** `Email Template Edited`
   - **Properties:** `template_id: string`, `edit_duration: number`

4. **Preview Template**
   - **Element:** Preview panel
   - **Event:** `Email Template Previewed`
   - **Properties:** `template_id: string`, `preview_mode: string`

5. **Save Template**
   - **Element:** Button "Save Template"
   - **Event:** `Email Template Saved`
   - **Properties:** `template_name: string`, `template_type: string`

---

## ⚙️ Integrations Screen (`/integrations`)

### Screen: Integration Management
**Screen Name:** `Integrations`
**Description:** External service integration configuration

#### User Stories & Events:

1. **View Integrations Screen**
   - **Event:** `Screen Viewed`
   - **Properties:** `screen_name: "Integrations"`, `total_integrations: number`

2. **Add New Integration**
   - **Element:** Button "Add Integration"
   - **Event:** `Add Integration Button Clicked`

3. **Test Connection**
   - **Element:** Button "Test Connection"
   - **Event:** `Integration Test Connection Clicked`
   - **Endpoint:** `POST /api/integrations/:id/test`
   - **Properties:** `integration_id: string`, `integration_type: string`, `test_result: boolean`

4. **Edit Integration**
   - **Element:** Edit button
   - **Event:** `Integration Edit Clicked`
   - **Properties:** `integration_id: string`, `integration_type: string`

5. **Delete Integration**
   - **Element:** Delete button
   - **Event:** `Integration Delete Clicked`
   - **Properties:** `integration_id: string`, `integration_type: string`

6. **View Integration Details**
   - **Element:** Integration card
   - **Event:** `Integration Details Viewed`
   - **Properties:** `integration_id: string`, `connection_status: string`, `metadata: object`

---

## 👨‍💼 Admin Screen (`/admin`)

### Screen: Administration Panel
**Screen Name:** `Admin`
**Description:** System administration and user management

#### User Stories & Events:

1. **View Admin Screen**
   - **Event:** `Screen Viewed`
   - **Properties:** `screen_name: "Admin"`, `user_role: string`

2. **Create New User**
   - **Element:** Button "Create User"
   - **Event:** `User Creation Initiated`

3. **Edit User**
   - **Element:** User edit button
   - **Event:** `User Edit Clicked`
   - **Properties:** `target_user_id: string`, `target_user_role: string`

4. **Delete User**
   - **Element:** User delete button
   - **Event:** `User Delete Clicked`
   - **Properties:** `target_user_id: string`, `confirmation_required: boolean`

5. **Change User Password**
   - **Element:** Reset password button
   - **Event:** `User Password Reset Clicked`
   - **Properties:** `target_user_id: string`

6. **Migration Operations**
   - **Element:** Migration buttons
   - **Event:** `Database Migration Initiated`
   - **Properties:** `migration_type: string`, `source_env: string`, `target_env: string`

---

## 📅 Calendar Screen (`/calendar`)

### Screen: Calendar Management
**Screen Name:** `Calendar`
**Description:** Schedule and event management interface

#### User Stories & Events:

1. **View Calendar**
   - **Event:** `Screen Viewed`
   - **Properties:** `screen_name: "Calendar"`, `current_view: string`

2. **Navigate Calendar**
   - **Element:** Navigation arrows
   - **Event:** `Calendar Navigation Clicked`
   - **Properties:** `navigation_direction: string`, `new_period: string`

3. **Change Calendar View**
   - **Element:** View toggle buttons
   - **Event:** `Calendar View Changed`
   - **Properties:** `previous_view: string`, `new_view: string`

4. **Create Event**
   - **Element:** Add event button
   - **Event:** `Calendar Event Created`
   - **Properties:** `event_type: string`, `event_date: string`

---

## 🔐 Authentication Flow

### Screen: Login
**Screen Name:** `Login`
**Description:** User authentication interface

#### User Stories & Events:

1. **Login Attempt**
   - **Element:** Login form submit
   - **Event:** `Login Attempted`
   - **Endpoint:** `POST /api/auth/login`
   - **Properties:** `login_method: string`, `success: boolean`

2. **Login Success**
   - **Event:** `User Logged In`
   - **Properties:** `user_id: string`, `user_role: string`, `login_duration: number`

3. **Login Failure**
   - **Event:** `Login Failed`
   - **Properties:** `error_type: string`, `attempt_count: number`

4. **Logout**
   - **Element:** Logout button
   - **Event:** `User Logged Out`
   - **Endpoint:** `POST /api/auth/logout`
   - **Properties:** `session_duration: number`

---

## 🎯 Global Navigation Events

### Sidebar Navigation
**Element:** Navigation links
**Description:** Primary application navigation

#### Navigation Events:

1. **Home Navigation**
   - **Event:** `Navigation Item Clicked`
   - **Properties:** `destination: "Home"`, `source_screen: string`

2. **Data Studio Navigation**
   - **Event:** `Navigation Item Clicked`
   - **Properties:** `destination: "Data Studio"`, `source_screen: string`

3. **Reports Navigation**
   - **Event:** `Navigation Item Clicked`
   - **Properties:** `destination: "Reports"`, `source_screen: string`

4. **Users Navigation**
   - **Event:** `Navigation Item Clicked`
   - **Properties:** `destination: "Users"`, `source_screen: string`

5. **Segments Navigation**
   - **Event:** `Navigation Item Clicked`
   - **Properties:** `destination: "Segments"`, `source_screen: string`

6. **Cohorts Navigation**
   - **Event:** `Navigation Item Clicked`
   - **Properties:** `destination: "Cohorts"`, `source_screen: string`

7. **Campaigns Navigation**
   - **Event:** `Navigation Item Clicked`
   - **Properties:** `destination: "Campaigns"`, `source_screen: string`

8. **Integrations Navigation**
   - **Event:** `Navigation Item Clicked`
   - **Properties:** `destination: "Integrations"`, `source_screen: string`

9. **Calendar Navigation**
   - **Event:** `Navigation Item Clicked`
   - **Properties:** `destination: "Calendar"`, `source_screen: string`

10. **Admin Navigation**
    - **Event:** `Navigation Item Clicked`
    - **Properties:** `destination: "Admin"`, `source_screen: string`

---

## 🔄 Template & Report Management

### Template Operations
**Description:** Template-specific user interactions

#### Template Events:

1. **View Templates**
   - **Event:** `Templates Viewed`
   - **Properties:** `total_templates: number`

2. **Create Template**
   - **Element:** Button "Create Template"
   - **Event:** `Template Creation Started`

3. **Create Report from Template**
   - **Element:** Button "Create Now"
   - **Event:** `Template Execute Now Clicked`
   - **Endpoint:** `POST /api/templates/:id/execute`
   - **Properties:** `template_id: string`, `template_name: string`, `report_name: string`

4. **Schedule Template**
   - **Element:** Button "Schedule"
   - **Event:** `Template Schedule Clicked`
   - **Properties:** `template_id: string`, `template_name: string`

5. **Edit Template**
   - **Element:** Edit button
   - **Event:** `Template Edit Clicked`
   - **Properties:** `template_id: string`, `template_name: string`

6. **Delete Template**
   - **Element:** Delete button
   - **Event:** `Template Delete Clicked`
   - **Properties:** `template_id: string`, `template_name: string`

### Scheduled Reports Operations
**Description:** Scheduled report management interactions

#### Scheduled Report Events:

1. **View Scheduled Reports**
   - **Event:** `Scheduled Reports Viewed`
   - **Properties:** `total_scheduled: number`, `active_count: number`

2. **Create Scheduled Report**
   - **Element:** Schedule form
   - **Event:** `Scheduled Report Created`
   - **Endpoint:** `POST /api/scheduled-reports-new`
   - **Properties:** `template_id: string`, `cron_expression: string`, `timezone: string`, `report_name: string`

3. **Execute Scheduled Report Now**
   - **Element:** Button "Execute Now"
   - **Event:** `Scheduled Report Execute Now Clicked`
   - **Endpoint:** `POST /api/scheduled-reports-new/:id/execute`
   - **Properties:** `report_id: string`, `report_name: string`

4. **Edit Scheduled Report**
   - **Element:** Edit button
   - **Event:** `Scheduled Report Edit Clicked`
   - **Properties:** `report_id: string`, `current_schedule: string`, `current_status: string`

5. **Pause/Resume Scheduled Report**
   - **Element:** Status dropdown
   - **Event:** `Scheduled Report Status Changed`
   - **Endpoint:** `PATCH /api/scheduled-reports-new/:id`
   - **Properties:** `report_id: string`, `new_status: string`, `previous_status: string`

6. **Delete Scheduled Report**
   - **Element:** Delete button
   - **Event:** `Scheduled Report Deleted`
   - **Endpoint:** `DELETE /api/scheduled-reports-new/:id`
   - **Properties:** `report_id: string`, `report_name: string`

---

## 📊 S3 Bucket Explorer

### Screen: S3 File Management
**Screen Name:** `S3 Bucket Explorer`
**Description:** Cloud storage file management interface

#### S3 Explorer Events:

1. **View S3 Explorer**
   - **Event:** `S3 Explorer Viewed`
   - **Properties:** `total_files: number`, `current_path: string`

2. **Navigate Folders**
   - **Element:** Folder click
   - **Event:** `S3 Folder Navigated`
   - **Properties:** `folder_path: string`, `file_count: number`

3. **Search Files**
   - **Element:** Search input
   - **Event:** `S3 File Search Performed`
   - **Properties:** `search_term: string`, `results_count: number`

4. **Filter Files**
   - **Element:** Filter dropdown
   - **Event:** `S3 File Filter Applied`
   - **Properties:** `filter_type: string`, `filter_value: string`

5. **Download File**
   - **Element:** Download button
   - **Event:** `S3 File Downloaded`
   - **Properties:** `file_name: string`, `file_size: number`, `file_type: string`

6. **Copy File Path**
   - **Element:** Copy path button
   - **Event:** `S3 File Path Copied`
   - **Properties:** `file_path: string`

7. **Delete File**
   - **Element:** Delete button
   - **Event:** `S3 File Deleted`
   - **Properties:** `file_name: string`, `file_size: number`

---

## 🚨 Error Tracking Events

### Global Error Events
**Description:** System-wide error tracking

#### Error Events:

1. **API Error**
   - **Event:** `API Error Occurred`
   - **Properties:** `endpoint: string`, `error_code: number`, `error_message: string`, `user_action: string`

2. **Database Connection Error**
   - **Event:** `Database Error Occurred`
   - **Properties:** `error_type: string`, `retry_attempt: number`, `resolution_time: number`

3. **Authentication Error**
   - **Event:** `Authentication Error Occurred`
   - **Properties:** `error_type: string`, `user_id: string`, `action_attempted: string`

4. **File Upload Error**
   - **Event:** `File Upload Error Occurred`
   - **Properties:** `file_type: string`, `file_size: number`, `error_reason: string`

5. **Query Execution Error**
   - **Event:** `Query Execution Error Occurred`
   - **Properties:** `query_type: string`, `data_source: string`, `error_message: string`

---

## 📈 Performance Tracking Events

### System Performance
**Description:** Application performance monitoring

#### Performance Events:

1. **Page Load Time**
   - **Event:** `Page Load Completed`
   - **Properties:** `screen_name: string`, `load_time: number`, `resource_count: number`

2. **Query Performance**
   - **Event:** `Query Performance Measured`
   - **Properties:** `query_type: string`, `execution_time: number`, `data_source: string`, `rows_returned: number`

3. **File Operation Performance**
   - **Event:** `File Operation Completed`
   - **Properties:** `operation_type: string`, `file_size: number`, `duration: number`

4. **Dashboard Refresh Performance**
   - **Event:** `Dashboard Refresh Completed`
   - **Properties:** `tile_count: number`, `total_refresh_time: number`, `failed_tiles: number`

---

## 🎯 Business Intelligence Events

### Data Analysis Actions
**Description:** Business intelligence and analytics interactions

#### BI Events:

1. **Chart Interaction**
   - **Event:** `Chart Interacted`
   - **Properties:** `chart_type: string`, `interaction_type: string`, `data_point: string`

2. **Filter Applied**
   - **Event:** `Data Filter Applied`
   - **Properties:** `filter_field: string`, `filter_value: string`, `affected_visualizations: number`

3. **Export Data**
   - **Event:** `Data Exported`
   - **Properties:** `export_format: string`, `row_count: number`, `columns: array`, `file_size: number`

4. **Drill Down**
   - **Event:** `Data Drill Down Performed`
   - **Properties:** `source_metric: string`, `drill_level: string`, `new_dimensions: array`

---

## 🔧 Implementation Guidelines

### Event Naming Convention
- Use **PascalCase** for event names
- Use **snake_case** for property names
- Include action verb in event names (Clicked, Viewed, Created, etc.)

### Standard Properties
Include these properties in **every** event:
- `user_id`: Current user identifier
- `user_email`: Current user email
- `user_role`: Current user role
- `timestamp`: Event timestamp
- `session_id`: User session identifier
- `screen_name`: Current screen/page name

### Event Categories
1. **Navigation Events**: User movement between screens
2. **Action Events**: User interactions with buttons/forms
3. **Data Events**: Database operations and queries
4. **System Events**: Application state changes
5. **Error Events**: Error occurrences and resolutions
6. **Performance Events**: System performance metrics

### Priority Implementation Order
1. **High Priority**: Navigation, Login/Logout, CRUD operations
2. **Medium Priority**: Search, filters, data interactions
3. **Low Priority**: Performance metrics, detailed error tracking

---

## 📋 Implementation Checklist

### Phase 1: Core Events ✅
- [ ] Screen view events for all pages
- [ ] Navigation click events
- [ ] Login/logout events
- [ ] CRUD operation events (create, edit, delete)

### Phase 2: User Interactions ⏳
- [ ] Button click events
- [ ] Form submission events
- [ ] Search and filter events
- [ ] File upload/download events

### Phase 3: Business Logic 🔄
- [ ] Template and report events
- [ ] Scheduled task events
- [ ] Integration management events
- [ ] Data query execution events

### Phase 4: Advanced Analytics 📈
- [ ] Performance tracking events
- [ ] Error tracking events
- [ ] User behavior flow events
- [ ] Business intelligence events

---

This comprehensive guide covers all user stories, interactions, and events across the Customer Data Platform for complete Amplitude analytics implementation.