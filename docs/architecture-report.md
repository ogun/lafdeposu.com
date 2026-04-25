# Laf Deposu - Software Architecture Report

## Overview
Laf Deposu is a Turkish word finder web application. It allows users to generate Turkish words from given letters. The application is a pure client-side Single Page Application (SPA) built with AngularJS 1.x.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Laf Deposu - Architecture                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────┐      ┌───────────────────────┐
│                         │      │                       │
│   User Interface        │      │   Data Layer          │
│   (AngularJS + Bootstrap│      │                       │
│    + jQuery)            │      │  ┌─────────────────┐  │
│                         │      │  │                 │  │
│  ┌─────────────────┐    │      │  │  SQLite DB      │  │
│  │  wordListCtrl   │    │      │  │  (dict.db)      │  │
│  │                 │    │      │  │                 │  │
│  │  • findWordsClick│    │      │  └─────────────────┘  │
│  │  • changeListType│    │      │          │           │
│  │                 │    │      └───────────┘           │
│  └─────────────────┘    │            │                 │
│         │                │            ▼                 │
│         ▼                │      ┌─────────────────┐    │
│  ┌─────────────────┐    │      │                 │    │
│  │  FindWord       │    │      │   sql.js         │    │
│  │  (Service)      │    │      │   (WebAssembly)  │    │
│  │                 │    │      │                 │    │
│  │  • database     │    │      └─────────────────┘    │
│  └─────────────────┘    │                             │
│         │                │                             │
│         ▼                │                             │
│  ┌─────────────────┐    │                             │
│  │  Share          │    │                             │
│  │  (Service)      │    │                             │
│  └─────────────────┘    │                             │
└─────────────────────────┴─────────────────────────────┘
```

## Structure

```
lafdeposu.com/
├── index.html          # Main HTML file
├── CNAME               # Custom domain
├── favicon.ico         # Site icon
├── LICENSE             # MIT License
├── css/
│   └── index.css       # Custom styles
├── js/
│   ├── app.js          # Core word processing logic
│   └── angular.js       # AngularJS module & controller definitions
├── data/
│   ├── dict.db         # SQLite dictionary database
│   ├── dict.sql        # Dictionary schema & data (SQLite dump)
│   └── dict.zip        # Compressed dictionary
├── dist/
│   ├── angular.min.js  # AngularJS library
│   ├── angular-resource.min.js  # AngularJS resource module
│   ├── angular-cookies.min.js   # AngularJS cookies module
│   ├── jquery-2.1.1.min.js      # jQuery library
│   ├── bootstrap.min.css         # Bootstrap CSS
│   ├── bootstrap.min.js           # Bootstrap JS
│   └── sql-wasm.js/               # SQLite WebAssembly
└── img/
    └── ajax-loader.gif # Loading animation
```

## Modules

### 1. Frontend Modules (AngularJS)

```
findWordsApp (Main Module)
├── Dependencies
│   ├── ngResource   (for API resources)
│   └── ngCookies    (for user preferences)
│
├── Services
│   ├── FindWord     (API service - unused in current client-side only implementation)
│   └── Share        (URL generation for sharing)
│
└── Controllers
    └── wordListCtrl
        ├── findWordsClick()
        ├── changeListType()
        └── wordList.maxRowCount() (computed property)
```

### 2. Core Logic Module (app.js)

```
app.js - Core Word Processing Functions
├── Database Initialization
│   ├── Load sql.js
│   ├── Load dict.db
│   └── Create SQLite connection
│
├── Word Processing
│   ├── controlInput()     # Validate user input
│   ├── controlDbWord()    # Check if word matches input letters
│   ├── listJokerChars()   # Identify joker/unused letters
│   ├── createCommandText() # Generate SQL query
│   ├── createResult()     # Main processing function
│   └── controlFilter()    # Apply additional filters
│
└── Exposed Functions
    └── createResult (global function)
```

## Data Flow

1. **User Input**
   - User enters letters in search field
   - Optional Turkish character buttons
   - Optional filter inputs (startsWith, contains, endsWith)
   - Two-letter words checkbox

2. **Processing**
   - `findWordsClick()` controller method called
   - Input validation via `controlInput()`
   - SQL query generation via `createCommandText()`
   - Database query via sql.js
   - Word matching via `controlDbWord()`
   - Filtering via `controlFilter()`
   - Joker character calculation via `listJokerChars()`

3. **Output**
   - Results grouped by word length
   - Display in table or list view
   - Joker characters highlighted in red
   - Word meanings shown

## Patterns

### 1. MVC Pattern
- **Model**: SQLite database and JavaScript data structures
- **View**: AngularJS templates with Bootstrap UI
- **Controller**: AngularJS controllers with jQuery enhancements

### 2. Service Layer
- `FindWord` service for API calls (currently unused)
- `Share` service for URL generation

### 3. Direct DOM Manipulation
- jQuery used for DOM manipulation alongside AngularJS
- Bootstrap components for UI

### 4. Client-Side Only Architecture
- No backend server required
- All processing done in browser
- SQLite database loaded via WebAssembly

## Technical Stack

- **Frontend Framework**: AngularJS 1.x
- **UI Framework**: Bootstrap 3
- **JavaScript Library**: jQuery 2.1.1
- **Database**: SQLite (via sql.js WebAssembly)
- **Language**: Turkish locale support
- **Architecture**: Single Page Application (SPA)

## Data Model

### SQLite Database Schema
```sql
CREATE TABLE dictionary (
    word TEXT,
    meaning TEXT
);
```

### Data Structures
```javascript
// Input structure
{
    chars: "abc*",          // Letters to form words
    startsWith: "a,b",      // Optional: words starting with
    contains: "c",          // Optional: words containing
    endsWith: "b",          // Optional: words ending with
    resultCharCount: 2      // Optional: show only 2-letter words
}

// Output structure
[
    {
        length: 3,
        words: [
            {
                w: "ABC",      // Word (HTML with joker spans)
                m: "meaning",  // Meaning
                j: "BC"        // Unused letters (jokers)
            }
        ]
    }
]
```

## Performance Considerations

1. **Database Loading**: SQLite database loaded on page load (may cause initial delay)
2. **Query Optimization**: SQL queries optimized by filtering out unused letters
3. **Client-Side Processing**: All processing done in browser, no server round-trips
4. **Caching**: User preferences (list type) stored in cookies

## Recommendations

1. **Modernize**: Consider migrating to modern framework (React, Vue, Angular)
2. **Lazy Loading**: Implement lazy loading for dictionary database
3. **Web Workers**: Offload heavy processing to Web Workers
4. **Service Worker**: Implement caching for offline usage
5. **Performance**: Optimize SQL queries for large datasets
6. **Security**: Sanitize user input to prevent XSS attacks

## Testing

The application currently lacks automated tests. Recommended:
- Unit tests for core word processing functions
- Integration tests for AngularJS components
- E2E tests for user workflows
- Performance tests for large datasets