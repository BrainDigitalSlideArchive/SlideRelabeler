const default_state = {
    api_auth: null, // Authentication status (true/false, checked via 'globus whoami')
    username: '', // Not used for CLI auth, but kept for UI consistency
    password: '', // Not used for CLI auth, but kept for UI consistency
    login_error: false,
    login_error_message: null,
    login_url: null, // Authentication URL from login command
    access_code: null, // Access code from login command
    login_pending: false, // Whether login is in progress (shows URL/code)
    auth_check_pending: false, // True while preflight whoami is in progress (show "Checking credentials…")
    authorization_code_input: '', // Authorization code from browser (user input)
    upload: false,
    delete_after: false,
    collection_name: '', // Endpoint alias/name query input (persisted)
    target_endpoint_id: '', // Selected destination endpoint UUID
    target_endpoint_label: '', // Selected endpoint display name
    remember_target_endpoint: false, // Persist selected endpoint for future sessions (opt-in)
    saved_target_endpoint_id: '', // Saved endpoint UUID when remember_target_endpoint is enabled
    saved_target_endpoint_label: '', // Saved endpoint label when remember_target_endpoint is enabled
    collection_path: '', // Full path for destination in endpointUUID:/path format
    source_endpoint: '', // Local endpoint ID only (Globus Connect Personal UUID); path is file's output_path
    upload_queue: [],
    /** Active Globus transfer jobs (dequeued, may include polling on main process). */
    upload_in_flight: 0,
    globus_collection_exists: null,
    globus_collection_error_message: null,
    globus_collection_error_detail: null,
    globus_collection_error_technical: null,
    cli_available: null, // Whether 'globus' command is available on system
    disable_ssl_verification: false, // Whether to disable SSL verification (for testing only, default: false = SSL verification enabled)
    globus_directory_refresh_nonce: 0, // Incremented on LOGIN_SUCCESS / manual retry to refetch target tree
    /** 'session' | 'durable' — how ModalGlobusEndpointPicker commits a chosen endpoint */
    endpoint_picker_mode: 'session',
};

export default default_state;
