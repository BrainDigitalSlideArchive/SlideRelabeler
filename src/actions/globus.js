export const LOGIN = 'globus/LOGIN';
export const LOGIN_SUCCESS = 'globus/LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'globus/LOGIN_FAILURE';
export const LOGOUT = 'globus/LOGOUT';
export const LOGOUT_SUCCESS = 'globus/LOGOUT_SUCCESS';
export const LOGOUT_FAILURE = 'globus/LOGOUT_FAILURE';
export const SET_GLOBUS_USERNAME = 'globus/SET_GLOBUS_USERNAME';
export const SET_GLOBUS_PASSWORD = 'globus/SET_GLOBUS_PASSWORD';
export const SET_GLOBUS_COLLECTION_NAME = 'globus/SET_GLOBUS_COLLECTION_NAME';
export const SET_GLOBUS_TARGET_ENDPOINT = 'globus/SET_GLOBUS_TARGET_ENDPOINT';
export const TOGGLE_REMEMBER_TARGET_ENDPOINT = 'globus/TOGGLE_REMEMBER_TARGET_ENDPOINT';
export const SET_GLOBUS_COLLECTION_PATH = 'globus/SET_GLOBUS_COLLECTION_PATH';
export const SET_GLOBUS_SOURCE_ENDPOINT = 'globus/SET_GLOBUS_SOURCE_ENDPOINT';
export const TOGGLE_UPLOAD_TO_GLOBUS = 'globus/TOGGLE_UPLOAD_TO_GLOBUS';
export const TOGGLE_DELETE_AFTER_GLOBUS_UPLOAD = 'globus/TOGGLE_DELETE_AFTER_GLOBUS_UPLOAD';
export const UPLOAD_FILE = 'globus/UPLOAD_FILE';
export const UPLOAD_BATCH = 'globus/UPLOAD_BATCH';
export const UPLOAD_FILE_SUCCESS = 'globus/UPLOAD_FILE_SUCCESS';
export const UPLOAD_FILE_COMPLETE = 'globus/UPLOAD_FILE_COMPLETE';
export const UPDATE_UPLOAD_STATUS = 'globus/UPDATE_UPLOAD_STATUS';
export const UPLOAD_FILE_FAILURE = 'globus/UPLOAD_FILE_FAILURE';
export const UPLOAD_FILE_FINALIZE = 'globus/UPLOAD_FILE_FINALIZE';
export const ADD_UPLOAD_FILE_TO_QUEUE = 'globus/ADD_UPLOAD_FILE_TO_QUEUE';
export const REMOVE_UPLOAD_FILE_FROM_QUEUE = 'globus/REMOVE_UPLOAD_FILE_FROM_QUEUE';
/** Increment when a Globus upload job starts (bounded parallel transfers; see uploadRouting.max_globus_parallel_uploads). */
export const GLOBUS_ACQUIRE_UPLOAD_SLOT = 'globus/GLOBUS_ACQUIRE_UPLOAD_SLOT';
/** Decrement when row_idx is unknown on IPC error; otherwise UPLOAD_FILE_COMPLETE / UPLOAD_FILE_FAILURE adjust the slot. */
export const GLOBUS_RELEASE_UPLOAD_SLOT = 'globus/GLOBUS_RELEASE_UPLOAD_SLOT';
/** Legacy no-op in reducer; upload coordinator polls with delay instead of TICK wakeups. */
export const GLOBUS_UPLOAD_COORDINATOR_TICK = 'globus/GLOBUS_UPLOAD_COORDINATOR_TICK';
export const SET_UPLOADING = 'globus/SET_UPLOADING';
export const GLOBUS_COLLECTION_EXISTS = 'globus/GLOBUS_COLLECTION_EXISTS';
export const GLOBUS_COLLECTION_DOES_NOT_EXIST = 'globus/GLOBUS_COLLECTION_DOES_NOT_EXIST';
export const CHECK_CLI_AVAILABLE = 'globus/CHECK_CLI_AVAILABLE';
export const SET_LOGIN_URL = 'globus/SET_LOGIN_URL';
export const SET_ACCESS_CODE = 'globus/SET_ACCESS_CODE';
export const SET_LOGIN_PENDING = 'globus/SET_LOGIN_PENDING';
export const SET_AUTH_CHECK_PENDING = 'globus/SET_AUTH_CHECK_PENDING';
export const CLEAR_LOGIN_INFO = 'globus/CLEAR_LOGIN_INFO';
export const CHECK_AUTH = 'globus/CHECK_AUTH';
export const SET_AUTHORIZATION_CODE_INPUT = 'globus/SET_AUTHORIZATION_CODE_INPUT';
export const SUBMIT_AUTHORIZATION_CODE = 'globus/SUBMIT_AUTHORIZATION_CODE';
export const TOGGLE_SSL_VERIFICATION = 'globus/TOGGLE_SSL_VERIFICATION';
export const SET_DISABLE_SSL_VERIFICATION = 'globus/SET_DISABLE_SSL_VERIFICATION';
export const RESTORE_GLOBUS_PERSISTED = 'globus/RESTORE_GLOBUS_PERSISTED';
export const BUMP_GLOBUS_DIRECTORY_REFRESH = 'globus/BUMP_GLOBUS_DIRECTORY_REFRESH';
/** 'session' | 'durable' — intent when ModalGlobusEndpointPicker confirms */
export const SET_GLOBUS_ENDPOINT_PICKER_MODE = 'globus/SET_GLOBUS_ENDPOINT_PICKER_MODE';
/** Internal: keep globus.upload / delete_after aligned with uploadRouting slice */
export const SYNC_UPLOAD_PREFS_FROM_ROUTING = 'globus/SYNC_UPLOAD_PREFS_FROM_ROUTING';
