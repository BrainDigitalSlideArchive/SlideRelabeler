import { initialSessionMetrics } from '../reducers/files/default_state';
import { makeEmptySearchFeedback } from './esm_search_feedback';

/**
 * Shape the Redux store for durable persistence (deid.tmp).
 * Strips passwords and live auth/session fields — same rules as save_store saga.
 */
export function buildPersistedStore(store) {
  if (!store || typeof store !== 'object') return store;

  const out = {
    ...store,
    esm: store.esm ? {
      integrationEnabled: store.esm.integrationEnabled,
      rememberUsername: store.esm.rememberUsername,
      username: store.esm.rememberUsername ? store.esm.username : '',
      profiles: store.esm.profiles,
      activeProfileId: store.esm.activeProfileId,
      authenticated: false,
      authToken: null,
      loading: false,
      error: false,
      errorMessage: null,
      searchLoading: false,
      searchFeedback: makeEmptySearchFeedback(),
      results: [],
      slidesByAccession: {},
      selectedIds: [],
    } : store.esm,
    dsa: store.dsa ? {
      api_url: store.dsa.api_url,
      username: store.dsa.username,
      folder_id: store.dsa.folder_id,
      folder_path: store.dsa.folder_path || '',
      upload: store.dsa.upload,
      delete_after: store.dsa.delete_after,
      upload_throttle_limit: store.dsa.upload_throttle_limit,
      api_auth: null,
      login_error: false,
      login_error_message: null,
      upload_queue: [],
      dsa_folder_exists: null,
      dsa_folder_error_message: null,
    } : store.dsa,
    uploadRouting: store.uploadRouting ? {
      local_output_enabled: store.uploadRouting.local_output_enabled,
      auto_upload: store.uploadRouting.auto_upload,
      keep_local_copy: store.uploadRouting.keep_local_copy,
      staging_dir_mode: store.uploadRouting.staging_dir_mode,
      staging_dir_custom: store.uploadRouting.staging_dir_custom,
      max_local_pending: store.uploadRouting.max_local_pending,
      max_globus_parallel_uploads: store.uploadRouting.max_globus_parallel_uploads,
      destination: store.uploadRouting.destination,
      default_local_output_dir: store.uploadRouting.default_local_output_dir ?? '',
    } : store.uploadRouting,
    globus: store.globus ? {
      disable_ssl_verification: store.globus.disable_ssl_verification,
      collection_name: store.globus.collection_name,
      target_endpoint_id: store.globus.target_endpoint_id,
      target_endpoint_label: store.globus.target_endpoint_label,
      remember_target_endpoint: store.globus.remember_target_endpoint,
      saved_target_endpoint_id: store.globus.saved_target_endpoint_id,
      saved_target_endpoint_label: store.globus.saved_target_endpoint_label,
      collection_path: store.globus.collection_path,
      source_endpoint: store.globus.source_endpoint,
      upload: store.globus.upload,
      delete_after: store.globus.delete_after,
      api_auth: null,
      login_error: false,
      login_error_message: null,
      login_url: null,
      access_code: null,
      login_pending: false,
      auth_check_pending: false,
      authorization_code_input: '',
      upload_queue: [],
      globus_collection_exists: null,
      globus_collection_error_message: null,
      globus_collection_error_detail: null,
      globus_collection_error_technical: null,
      cli_available: store.globus.cli_available,
      username: store.globus.username,
    } : store.globus,
    files: store.files
      ? { ...store.files, session_metrics: { ...initialSessionMetrics } }
      : store.files,
    auditLog: store.auditLog ?? undefined,
    apiIntegrations: store.apiIntegrations ? {
      lastSelectedId: store.apiIntegrations.lastSelectedId,
    } : store.apiIntegrations,
  };

  // Configuration profiles live in a dedicated userData file, not deid.tmp.
  delete out.configProfiles;
  return out;
}
