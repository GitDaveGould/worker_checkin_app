Initialize a new web application project for a worker check-in system with the following requirements:

## Project Overview
Build a unified web application for festival/event worker check-ins with tablet-optimized interface for workers and desktop admin portal.

## Core User Flows

**Returning Worker Check-in:**
- Real-time search after 3+ characters typed
- Display search results with Name, Phone, Email for identification
- Profile selection → 3 questions → Terms agreement → Confirmation screen → Auto-return to home after 5 seconds
- One check-in per worker per event validation

**New Worker Registration:**
- Full profile creation with duplicate email/phone validation
- If duplicate found, suggest using returning worker option
- Fields: First Name, Last Name, DOB, Email (unique), Phone (unique), Street Address, City, State, Zip, Country

**Check-in Questions:**
- Question 1: Dropdown list
- Question 2: Yes/No
- Question 3: Two dropdown lists

## Data Model

**Workers Table:**
- ID, First Name, Last Name, DOB, Email (unique), Phone (unique), Street Address, City, State, Zip, Country

**Events Table:**
- ID, Name, Start Date, End Date, Location, Active Status

**Check-ins Table:**
- ID, Worker ID, Event ID, Timestamp, Question 1 Response, Question 2 Response, Question 3 Response, Terms Accepted

**Admin Settings:**
- Terms and Conditions text

## Admin Portal Features
- Full CRUD operations on check-ins and worker profiles
- Event management with JSON import capability
- Set/override "event of the week" (auto-determined by current date within event date ranges)
- Reporting with filters (event, date range, location) and CSV/Excel export
- Real-time dashboard showing current event check-in counts
- Terms and conditions editor

## Technical Requirements
- Use PostgreSQL database
- Tablet-optimized check-in interface, desktop-optimized admin interface
- Simple password authentication for admin access
- No authentication required for worker check-in
- Global address format for international workers
- Real-time search functionality

## Business Rules
- Only one check-in allowed per worker per event
- Active event auto-determined by current date falling within event start/end dates
- Prevent duplicate worker accounts (validate email/phone during registration)

Please start by setting up the project structure, database schema, and core check-in functionality first.