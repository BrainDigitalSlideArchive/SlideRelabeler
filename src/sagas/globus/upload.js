import { select, take, put, fork, call, join, cancel, delay } from 'redux-saga/effects';

import * as globus_actions from '../../actions/globus';
import * as files_actions from '../../actions/files';
import { isGlobusEndpointUuid } from '../../helpers/globus_helpers';
import { isGlobusUploadRoutingActive } from '../../helpers/upload_activity.js';
import { syncDerivedUploading } from '../upload_activity.js';

const electronAPI = typeof window !== 'undefined' ? window.electronAPI : null;

function selectMaxGlobusParallelUploads(state) {
    const v = parseInt(state.uploadRouting?.max_globus_parallel_uploads, 10);
    return Number.isFinite(v) && v >= 1 && v <= 16 ? v : 4;
}

function normalizeWindowsPathForGcp(rawPath) {
    if (rawPath == null) return '';
    const p = String(rawPath).trim();
    if (!p) return '';

    // UNC paths (\\server\share\...) are not reliably addressable by GCP path namespace.
    if (/^(\\\\|\/\/)/.test(p)) {
        return null;
    }

    // Convert to forward slashes for globus CLI usage.
    const slash = p.replace(/\\/g, '/');

    // Drive-letter absolute path: C:/Users/... -> /C/Users/...
    const m = /^([a-zA-Z]):\/(.*)$/.exec(slash);
    if (m) {
        const drive = m[1].toUpperCase();
        const rest = m[2];
        return `/${drive}/${rest}`.replace(/\/+/g, '/');
    }

    // Already looks like a GCP path (/C/Users/...) or relative path; return as-is.
    return slash;
}

function toGridRowIndex(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
}

function splitEndpointPath(endpointColonPath) {
    const s = String(endpointColonPath || '');
    const idx = s.indexOf(':');
    if (idx < 0) return { endpointId: s.trim(), path: '' };
    return {
        endpointId: s.slice(0, idx).trim(),
        path: s.slice(idx + 1),
    };
}

function* watch_complete_upload(row_idx) {
    const want = toGridRowIndex(row_idx);
    const action = yield take((a) => {
        if (a.type === globus_actions.UPLOAD_FILE_COMPLETE) {
            const p = a.payload;
            const ri = p && typeof p === 'object' && p.row_idx !== undefined ? p.row_idx : p;
            return toGridRowIndex(ri) === want;
        }
        if (a.type === globus_actions.UPLOAD_FILE_FAILURE) {
            const p = a.payload;
            const ri = p && typeof p === 'object' && p.row_idx !== undefined ? p.row_idx : p;
            return toGridRowIndex(ri) === want;
        }
        return false;
    });
    if (action.type === globus_actions.UPLOAD_FILE_COMPLETE) {
        yield put({ type: files_actions.UPLOAD_FILE_FINALIZE, payload: { row_idx: row_idx } });

        let delete_after = yield select(state => state.globus.delete_after);
        if (delete_after) {
            const file_rows = yield select(state => state.files.file_rows);
            const file_path = file_rows[row_idx].__reserved.output_path;
            yield call(electronAPI.deleteFile, file_path.replace(/\\/g, '/'));
            yield put({ type: files_actions.UPLOAD_DELETE_AFTER, payload: { row_idx: row_idx } });
        }
    }
}

function* finalizeGlobusRowAfterBatch(row_idx) {
    yield put({ type: files_actions.UPLOAD_FILE_FINALIZE, payload: { row_idx } });
    const delete_after = yield select((state) => state.globus.delete_after);
    if (delete_after) {
        const file_rows = yield select((state) => state.files.file_rows);
        const file_path = file_rows[row_idx]?.__reserved?.output_path;
        if (file_path) {
            yield call(electronAPI.deleteFile, file_path.replace(/\\/g, '/'));
            yield put({ type: files_actions.UPLOAD_DELETE_AFTER, payload: { row_idx } });
        }
    }
}

/**
 * Bounded parallel Globus queue: dequeue on start, fork uploads while upload_in_flight < max.
 * Main must keep using event.sender per globus-upload-file invoke so concurrent polls target the right renderer.
 */
function* upload_queue() {
    while (true) {
        const uploadRouting = yield select((state) => state.uploadRouting);
        if (!isGlobusUploadRoutingActive(uploadRouting)) {
            // Still sync so leftover in_flight keeps files.uploading correct during DSA runs.
            yield call(syncDerivedUploading);
            yield delay(1000);
            continue;
        }

        if (electronAPI?.ensureGlobusUploadIpcSubscribed) {
            if (window.redux_store?.dispatch) {
                yield call(electronAPI.ensureGlobusUploadIpcSubscribed, window.redux_store.dispatch);
            } else {
                console.warn(
                    '[GlobusSaga] window.redux_store.dispatch is not set; Globus upload IPC listeners are not registered. Progress/complete will not reach Redux.'
                );
            }
        } else {
            console.warn('[GlobusSaga] electronAPI.ensureGlobusUploadIpcSubscribed is missing (preload bridge).');
        }
        let queue = yield select((state) => state.globus.upload_queue);
        let inFlight = yield select((state) => state.globus.upload_in_flight);
        let maxConcurrent = yield select(selectMaxGlobusParallelUploads);
        while (queue.length > 0 && inFlight < maxConcurrent) {
            yield call(syncDerivedUploading);
            const upload_payload = queue[0];
            if (upload_payload?.kind === 'batch') {
                yield put({
                    type: globus_actions.REMOVE_UPLOAD_FILE_FROM_QUEUE,
                    payload: { batchId: upload_payload.batchId },
                });
                yield put({ type: globus_actions.GLOBUS_ACQUIRE_UPLOAD_SLOT });
                yield fork(upload_batch, upload_payload);
            } else {
                yield put({ type: globus_actions.REMOVE_UPLOAD_FILE_FROM_QUEUE, payload: upload_payload.row_idx });
                yield put({ type: globus_actions.GLOBUS_ACQUIRE_UPLOAD_SLOT });
                yield fork(upload_file, upload_payload);
            }
            queue = yield select((state) => state.globus.upload_queue);
            inFlight = yield select((state) => state.globus.upload_in_flight);
            maxConcurrent = yield select(selectMaxGlobusParallelUploads);
        }
        yield call(syncDerivedUploading);
        yield delay(1000);
    }
}

function* watch_upload() {
    yield fork(upload_queue);
    while (true) {
        const action = yield take([globus_actions.UPLOAD_FILE, globus_actions.UPLOAD_BATCH]);
        const p = action.payload || {};
        if (action.type === globus_actions.UPLOAD_BATCH) {
            const batchId =
                (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
                    ? crypto.randomUUID()
                    : `batch_${Date.now()}_${Math.random().toString(16).slice(2)}`;
            yield put({
                type: globus_actions.ADD_UPLOAD_FILE_TO_QUEUE,
                payload: {
                    kind: 'batch',
                    batchId,
                    items: (p.items || []).map((it) => ({
                        ...it,
                        row_idx: toGridRowIndex(it.row_idx),
                    })),
                    collection_path: p.collection_path,
                    source_endpoint: p.source_endpoint,
                },
            });
        } else {
            yield put({
                type: globus_actions.ADD_UPLOAD_FILE_TO_QUEUE,
                payload: {
                    ...p,
                    row_idx: toGridRowIndex(p.row_idx),
                },
            });
        }
    }
}

function* upload_file(payload) {
    const { collection_path, row_idx, file_path, file, source_endpoint } = payload;

    const runtimeApi = typeof window !== 'undefined' ? window.electronAPI : null;

    if (!(file && row_idx != null && file_path)) {
        yield put({
            type: globus_actions.UPLOAD_FILE_FAILURE,
            payload: { row_idx, message: 'Invalid file or path for Globus upload.' },
        });
        return;
    }

    const state_source_endpoint = yield select(state => state.globus.source_endpoint);
    const local_endpoint_id = (source_endpoint || state_source_endpoint || '').trim();
    if (!local_endpoint_id) {
        yield put({
            type: globus_actions.UPLOAD_FILE_FAILURE,
            payload: {
                row_idx: row_idx,
                message: 'Local endpoint ID not configured. Set your Globus Connect Personal endpoint ID in Network -> Globus.',
            },
        });
        return;
    }
    if (!isGlobusEndpointUuid(local_endpoint_id)) {
        yield put({
            type: globus_actions.UPLOAD_FILE_FAILURE,
            payload: {
                row_idx: row_idx,
                message:
                    'Local endpoint ID must be a Globus endpoint UUID (not a display name). Use “Use this computer’s GCP ID” in Network → Globus or run: globus endpoint local-id',
            },
        });
        return;
    }
    const normalizedLocalPath = normalizeWindowsPathForGcp(file_path || '');
    if (normalizedLocalPath == null) {
        yield put({
            type: globus_actions.UPLOAD_FILE_FAILURE,
            payload: {
                row_idx,
                message:
                    'Local source path is a UNC/network path (e.g. \\\\server\\share\\...). Globus Connect Personal typically cannot address UNC paths directly. Copy outputs to a local drive (e.g. C:\\\\...) or configure a Globus Connect Server collection for the network share.',
            },
        });
        return;
    }
    const source_path = local_endpoint_id + ':' + normalizedLocalPath;
    const baseName = (file_path || '').split(/[/\\]/).pop() || 'file';
    const dest_dir = (collection_path || '').replace(/\/$/, '');
    const dest_path = dest_dir ? dest_dir + '/' + baseName : baseName;

    const file_size_bytes = file?.__reserved?.bytes ?? null;

    const api = runtimeApi || electronAPI;

    if (api?.globusUploadFileWithSize) {
        const watchTask = yield fork(watch_complete_upload, row_idx);
        yield put({
            type: files_actions.UPLOAD_FILE_STARTED,
            payload: { row_idx, indeterminate: true },
        });
        const upload_response = yield call(
            api.globusUploadFileWithSize,
            source_path,
            dest_path,
            file_path,
            row_idx,
            file_size_bytes
        );
        if (!upload_response || !upload_response[0]) {
            yield cancel(watchTask);
            yield put({
                type: globus_actions.UPLOAD_FILE_FAILURE,
                payload: {
                    row_idx: row_idx,
                    message: upload_response[1]?.message || 'Failed to initiate transfer',
                },
            });
            return;
        }
        yield join(watchTask);
        return;
    }

    const watchTask = yield fork(watch_complete_upload, row_idx);
    yield put({
        type: files_actions.UPLOAD_FILE_STARTED,
        payload: { row_idx, indeterminate: true },
    });
    const upload_response = yield call(api.globusUploadFile, source_path, dest_path, file_path, row_idx);
    if (!upload_response || !upload_response[0]) {
        yield cancel(watchTask);
        yield put({
            type: globus_actions.UPLOAD_FILE_FAILURE,
            payload: {
                row_idx: row_idx,
                message: upload_response[1]?.message || 'Failed to initiate transfer',
            },
        });
        return;
    }
    yield join(watchTask);
}

function* upload_batch(payload) {
    const items = payload?.items || [];
    const collection_path = payload?.collection_path;
    const source_endpoint = payload?.source_endpoint;
    const runtimeApi = typeof window !== 'undefined' ? window.electronAPI : null;
    const api = runtimeApi || electronAPI;

    const failAll = function* (message) {
        for (const item of items) {
            yield put({
                type: files_actions.UPLOAD_FILE_ERROR,
                payload: { row_idx: item.row_idx, error: message, file_path: item.file_path },
            });
            yield put({
                type: globus_actions.UPLOAD_FILE_FAILURE,
                payload: { row_idx: item.row_idx, message },
                meta: { skipInFlight: true },
            });
        }
        yield put({ type: globus_actions.GLOBUS_RELEASE_UPLOAD_SLOT });
    };

    if (!items.length) {
        yield put({ type: globus_actions.GLOBUS_RELEASE_UPLOAD_SLOT });
        return;
    }

    if (!api?.globusUploadBatch) {
        yield* failAll('Globus batch upload is not available in this build.');
        return;
    }

    const state_source_endpoint = yield select((state) => state.globus.source_endpoint);
    const local_endpoint_id = (source_endpoint || state_source_endpoint || '').trim();
    if (!local_endpoint_id || !isGlobusEndpointUuid(local_endpoint_id)) {
        yield* failAll(
            !local_endpoint_id
                ? 'Local endpoint ID not configured. Set your Globus Connect Personal endpoint ID in Network -> Globus.'
                : 'Local endpoint ID must be a Globus endpoint UUID (not a display name).',
        );
        return;
    }

    const dest_dir = (collection_path || '').replace(/\/$/, '');
    const targetFallback = yield select((state) => state.globus.target_endpoint_id);
    let destEndpointId = '';
    const pairs = [];
    const batchItems = [];

    for (const item of items) {
        const normalizedLocalPath = normalizeWindowsPathForGcp(item.file_path || '');
        if (normalizedLocalPath == null) {
            yield* failAll(
                'Local source path is a UNC/network path. Globus Connect Personal typically cannot address UNC paths directly.',
            );
            return;
        }
        const baseName = (item.file_path || '').split(/[/\\]/).pop() || 'file';
        const destFull = dest_dir ? `${dest_dir}/${baseName}` : baseName;
        const destParts = splitEndpointPath(destFull);
        if (destParts.endpointId && isGlobusEndpointUuid(destParts.endpointId)) {
            destEndpointId = destParts.endpointId;
            pairs.push({ sourcePath: normalizedLocalPath, destPath: destParts.path });
        } else {
            const colParts = splitEndpointPath(collection_path || '');
            if (colParts.endpointId && isGlobusEndpointUuid(colParts.endpointId)) {
                destEndpointId = colParts.endpointId;
                const dir = (colParts.path || '').replace(/\/$/, '');
                pairs.push({
                    sourcePath: normalizedLocalPath,
                    destPath: dir ? `${dir}/${baseName}` : baseName,
                });
            } else {
                pairs.push({ sourcePath: normalizedLocalPath, destPath: destFull });
            }
        }
        batchItems.push({
            row_idx: item.row_idx,
            file_path: item.file_path,
            file_size_bytes: item.file?.__reserved?.bytes ?? item.file_size_bytes ?? null,
        });
    }

    destEndpointId = String(destEndpointId || targetFallback || '').trim();
    if (!destEndpointId) {
        yield* failAll('Globus destination endpoint is not set.');
        return;
    }

    for (const item of items) {
        yield put({
            type: files_actions.UPLOAD_FILE_STARTED,
            payload: { row_idx: item.row_idx, indeterminate: true },
        });
    }

    const upload_response = yield call(api.globusUploadBatch, {
        sourceEndpointId: local_endpoint_id,
        destEndpointId,
        pairs,
        items: batchItems,
    });

    if (!upload_response || !upload_response[0]) {
        yield* failAll(upload_response?.[1]?.message || 'Failed to complete Globus batch transfer');
        return;
    }

    const durationSec = upload_response[1]?.duration_sec;
    const effectiveBps = upload_response[1]?.effective_bytes_per_second;
    for (const item of items) {
        if (durationSec != null) {
            yield put({
                type: files_actions.GLOBUS_UPLOAD_FILE_METRICS,
                payload: {
                    row_idx: item.row_idx,
                    duration_sec: durationSec,
                    effective_bytes_per_second: effectiveBps ?? 0,
                },
            });
        }
        yield* finalizeGlobusRowAfterBatch(item.row_idx);
    }
    yield put({ type: globus_actions.GLOBUS_RELEASE_UPLOAD_SLOT });
}

export default watch_upload;
