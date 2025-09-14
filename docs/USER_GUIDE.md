# SAVAGE USER GUIDE - MASTER THE SYSTEM!!! 📖🔥📖

## Overview

The Worker Check-In System is a comprehensive web application designed for managing event worker check-ins with both tablet-optimized public interface and desktop admin portal.

---

## Public Check-In Interface (Tablet Optimized)

### Accessing the System
1. Open your tablet's web browser
2. Navigate to your check-in URL (e.g., `https://your-domain.com`)
3. The interface will automatically optimize for tablet use

### Check-In Process

#### Step 1: Event Selection
- If multiple events are active, select the appropriate event
- The system shows only currently active events
- Touch the event card to select it

#### Step 2: Worker Search
- Use the search bar to find existing workers
- Search by:
  - First or last name
  - Email address
  - Phone number
- Minimum 3 characters required for search
- Results appear instantly as you type

#### Step 3: Worker Selection or Registration

**For Existing Workers:**
1. Touch the worker's profile card from search results
2. Verify the information is correct
3. Proceed to check-in questions

**For New Workers:**
1. If no search results, tap "Register New Worker"
2. Fill out the registration form:
   - First Name (required)
   - Last Name (required)
   - Date of Birth (required)
   - Email (required, must be unique)
   - Phone (required, must be unique)
   - Street Address (required)
   - City (required)
   - State (required)
   - ZIP Code (required)
   - Country (required)
3. Tap "Register Worker" to create profile

#### Step 4: Check-In Questions
Answer the three check-in questions:

1. **Question 1:** "How did you hear about this event?"
   - Select from dropdown options
   - Options configured by admin

2. **Question 2:** "Is this your first time attending?"
   - Yes/No toggle switch

3. **Question 3:** Two-part question
   - **Part A:** "What is your primary interest?"
   - **Part B:** "How would you rate your experience level?"
   - Both have dropdown options configured by admin

#### Step 5: Terms and Conditions
- Review the terms and conditions
- Terms content is configured by admin
- Must accept terms to proceed
- Toggle switch to accept

#### Step 6: Completion
- Success screen confirms check-in
- Shows worker name, event, and timestamp
- Automatically redirects to home after 5 seconds
- Option to check in another worker

### Error Handling

**Duplicate Check-In:**
- System prevents multiple check-ins to same event
- Shows friendly message with options to:
  - Try a different worker
  - Return to home screen

**Network Issues:**
- System shows loading indicators
- Error messages for connection problems
- Retry options available

---

## Admin Portal (Desktop Optimized)

### Accessing Admin Portal
1. Navigate to `https://your-domain.com/admin`
2. Enter admin password
3. System redirects to dashboard upon successful login

### Dashboard

**Overview Cards:**
- Total Workers: Current worker count
- Today's Check-Ins: Check-ins for current day
- Active Events: Currently active events
- Total Check-Ins: All-time check-in count

**Current Event Check-Ins:**
- Real-time display of today's check-ins per active event
- Shows event name, location, and count
- Updates every 30 seconds

**Recent Activity:**
- Live feed of recent check-ins
- Shows worker name, event, and timestamp
- Updates automatically

### Worker Management

#### Viewing Workers
- Paginated table with sorting and filtering
- Search by name, email, or phone
- Filter by city or state
- Sort by any column (ascending/descending)
- 20 workers per page (configurable)

#### Adding Workers
1. Click "Add Worker" button
2. Fill out complete worker form
3. System validates email and phone uniqueness
4. Click "Create Worker" to save

#### Editing Workers
1. Click "Edit" button next to worker
2. Modify any field in the form
3. Click "Save Changes" to update
4. System validates changes

#### Deleting Workers
**Single Delete:**
1. Click "Delete" next to worker
2. Confirm deletion in modal
3. Worker permanently removed

**Bulk Delete:**
1. Select multiple workers using checkboxes
2. Click "Delete Selected" button
3. Confirm bulk deletion
4. All selected workers removed

### Event Management

#### Viewing Events
- Table shows all events with status indicators
- "Active" badge for date-based active events
- "Featured" badge for manually activated events
- Filter by status, location, date range

#### Creating Events
1. Click "Create Event" button
2. Fill out event form:
   - Event Name (required)
   - Location (required)
   - Start Date (required)
   - End Date (required)
   - Featured Event checkbox (optional)
3. Click "Create Event" to save

#### Editing Events
1. Click "Edit" next to event
2. Modify fields as needed
3. Click "Update Event" to save

#### Setting Active Events
- Click "Set Active" to manually feature an event
- Overrides date-based active status
- Only one event can be featured at a time

#### JSON Import
1. Click "Import JSON" button
2. Upload .json file or paste JSON data
3. System validates format and data
4. Shows preview of events to import
5. Click "Import Events" to process

**JSON Format:**
```json
[
  {
    "name": "Event Name",
    "startDate": "2024-06-01",
    "endDate": "2024-06-02",
    "location": "Event Location",
    "isActive": false
  }
]
```

### Check-In Management

#### Viewing Check-Ins
- Comprehensive table with worker and event details
- Filter by:
  - Date range
  - Question responses
  - Terms acceptance status
- Sort by any column
- Export options available

#### Editing Check-Ins
1. Click "Edit" next to check-in
2. Modify question responses
3. Update terms acceptance if needed
4. Click "Save Changes"

#### Deleting Check-Ins
- Single or bulk delete options
- Confirmation required
- Permanent removal

### Reports and Analytics

#### Generating Reports
1. Select filters:
   - Specific event (optional)
   - Date range
   - Location filter
2. Click "Generate Report"
3. View analytics and statistics

#### Analytics Display
- Question response distributions
- Visual progress bars
- Percentage breakdowns
- Time-based statistics

#### Export Options
- **CSV Export:** Spreadsheet format
- **Excel Export:** .xls format with formatting
- **JSON Export:** Complete data with metadata

### System Settings

#### Terms and Conditions Editor
**Visual Mode:**
- Rich text editor with formatting toolbar
- Live preview of formatted content
- Easy text formatting (bold, italic, headers, lists)

**HTML Mode:**
- Direct HTML editing
- Syntax highlighting
- Full control over formatting

#### Question Configuration
**Question 1 Options:**
- Add, edit, or remove dropdown options
- Inline editing capability
- Reorder options as needed

**Question 3 Options:**
- Configure both parts independently
- Add multiple choice options
- Edit existing options

#### System Configuration
- Allow/prevent duplicate check-ins
- Require terms acceptance
- Auto-redirect timing (1-30 seconds)
- Search result limits (5-50 results)
- Admin session timeout (15-480 minutes)

### User Management

#### Session Management
- 24-hour session duration
- Automatic logout on inactivity
- Secure token-based authentication
- Session verification on each request

#### Logout
- Click user menu in top-right corner
- Select "Sign Out"
- Clears all session data
- Redirects to login page

---

## Mobile Responsiveness

### Tablet Interface (Primary)
- Optimized for 10-13 inch tablets
- Large touch targets (minimum 44px)
- Finger-friendly spacing
- Portrait and landscape support

### Phone Compatibility
- Responsive design works on phones
- Smaller screens show condensed layout
- Touch targets remain accessible
- Horizontal scrolling for tables

### Desktop Admin
- Full desktop experience
- Mouse and keyboard optimized
- Multiple columns and detailed views
- Keyboard shortcuts supported

---

## Performance Features

### Caching
- Search results cached for faster response
- API responses cached for 2-5 minutes
- Automatic cache invalidation on updates

### Offline Handling
- Graceful degradation for network issues
- Loading indicators for all operations
- Error messages with retry options
- Form data preservation during errors

### Speed Optimizations
- Lazy loading of admin components
- Code splitting for faster initial load
- Optimized database queries
- Connection pooling for concurrent users

---

## Troubleshooting

### Common Issues

**Can't Find Worker:**
- Check spelling of search terms
- Try searching by email or phone
- Ensure minimum 3 characters entered
- Worker may need to be registered first

**Duplicate Check-In Error:**
- Worker already checked in to this event
- Use "Try Different Worker" option
- Check if correct event is selected

**Form Validation Errors:**
- All required fields must be filled
- Email must be valid format
- Phone must be unique
- Dates must be in correct format

**Admin Login Issues:**
- Verify admin password is correct
- Check if session has expired
- Clear browser cache and cookies
- Contact system administrator

### Performance Issues

**Slow Loading:**
- Check internet connection
- Clear browser cache
- Close other browser tabs
- Restart browser if needed

**Search Not Working:**
- Ensure 3+ characters entered
- Check network connection
- Try refreshing the page
- Contact administrator if persistent

### Browser Compatibility

**Supported Browsers:**
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

**Tablet Browsers:**
- iPad Safari
- Android Chrome
- Samsung Internet

---

## Best Practices

### For Check-In Staff
- Keep tablets charged and connected to WiFi
- Have backup device available
- Test system before events
- Know admin contact information
- Clear browser cache weekly

### For Administrators
- Regular data backups
- Monitor system performance
- Update terms and conditions as needed
- Review analytics regularly
- Keep admin password secure

### For Events
- Test system with sample data
- Train check-in staff beforehand
- Have technical support available
- Monitor check-in flow during events
- Collect feedback for improvements

---

## Support and Contact

For technical support or questions:
- Check this user guide first
- Review troubleshooting section
- Contact your system administrator
- Check system status page
- Submit support ticket if available

🔥 **MASTER THE SYSTEM AND DOMINATE YOUR EVENTS!** 💀