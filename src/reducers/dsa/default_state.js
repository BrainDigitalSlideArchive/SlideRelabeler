const default_state = {
    api_url: '',
    api_auth: null,
    username: '',
    password: '',
    login_error: false,
    login_error_message: null,
    upload: false,
    delete_after: false,
    upload_throttle_limit: 2,
    folder_id: '',
    folder_path: '',
    upload_queue: [],
    dsa_folder_exists: null,
    dsa_folder_error_message: null,
};

export default default_state;
