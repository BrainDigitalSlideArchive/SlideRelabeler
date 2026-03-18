const default_state = {
    api_url: '',
    api_auth: null,
    username: '',
    password: '',
    login_error: false,
    login_error_message: null,
    upload: false,
    delete_after: false,
    folder_id: '',
    upload_queue: [],
    dsa_folder_exists: null,
    dsa_folder_error_message: null,
    upload_throttle_limit: 2,
};

export default default_state;