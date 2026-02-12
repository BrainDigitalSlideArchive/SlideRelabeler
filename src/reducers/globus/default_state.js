const default_state = {
    api_auth: null, // Authentication status (true/false, checked via 'globus whoami')
    username: '', // Not used for CLI auth, but kept for UI consistency
    password: '', // Not used for CLI auth, but kept for UI consistency
    login_error: false,
    login_error_message: null,
    login_url: null, // Authentication URL from login command
    access_code: null, // Access code from login command
    login_pending: false, // Whether login is in progress (shows URL/code)
    authorization_code_input: '', // Authorization code from browser (user input)
    upload: false,
    delete_after: false,
    collection_name: '', // Default collection name (persisted)
    collection_path: '', // Full path: collectionname#/path/to/folder
    source_endpoint: '', // Source endpoint for local files (e.g., from Globus Connect Personal)
    upload_queue: [],
    globus_collection_exists: null,
    globus_collection_error_message: null,
    cli_available: null, // Whether 'globus' command is available on system
    disable_ssl_verification: false, // Whether to disable SSL verification (for testing only, default: false = SSL verification enabled)
};

export default default_state;
