const default_state = {
    // api_url: 'https://braincomp.pathology.pitt.edu/dsa/api/v1',
    api_url: 'https://pearcelab.pitt.edu/dsa/api/v1',
    api_auth: null,
    username: '',
    password: '',
    login_error: false,
    login_error_message: null,
    upload: false,
    delete_after: false,
    upload_throttle_limit: 2,
    // folder_id: '689ca9edbc6082acbe2389b4',
    folder_id: '67225cffd5d50b15122597b2',
    upload_queue: [],
    dsa_folder_exists: null,
    dsa_folder_error_message: null,
};

export default default_state;