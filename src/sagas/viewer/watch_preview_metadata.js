import {take, put, call, select} from 'redux-saga/effects'

import * as preview_actions from '../../actions/preview';

import { structToObject } from '../../helpers/grpc_helpers';
import { logMetadataPreview } from '../../helpers/metadata_preview_debug';

function are_values_diff(prior, after) {
    let max_length = 0;

    if (!prior || !after) {
        return true;

    } else {
        max_length = Math.max(prior.length, after.length);
    }

    for (let i = 0; i < max_length; i++) {
        if (prior[i] && after[i]) {
            if (prior[i] != after[i])  {
                return true;
            }
        }
    }

    return false;
}

function convert_json_ifds(ifds) {
    if (!Array.isArray(ifds)) {
        return;
    }
    for (let ifd of ifds) {
        for (let tag in ifd['tags']) {
            if (ifd['tags'][tag]['data'] && ifd['tags'][tag]['datatype'] == 7) {
                try { 
                    ifd['tags'][tag]['data'] = atob(ifd['tags'][tag]['data']);
                } catch (e) {
                    ifd['tags'][tag]['data'] = ifd['tags'][tag]['data'];
                }
            }
        }
    }
}

function setup_table(tiff_tags, ifds_for_row) {
    if (!ifds_for_row) {
        return {};
    }

    let {prior, after} = ifds_for_row;

    let table = {};
    for (let i = 0; i < prior.length; i++) {
        if (!table[i]) {
            table[i] = {};
        }
        for (let tag_key in prior[i]['tags']) {
            let tag = prior[i]['tags'][tag_key];
            if (!table[i][tag_key]) {
                let tag_dict = {...tag};
                delete tag_dict['data'];
                table[i][tag_key] = tag_dict;
                table[i][tag_key]['name'] = tiff_tags[tag_key] && tiff_tags[tag_key].name;
            }
            table[i][tag_key]['prior'] = tag['data'];
        }
    }

    for (let i = 0; i < after.length; i++) {
        if (!table[i]) {
            table[i] = {};
        }
        for (let tag_key in after[i]['tags']) {
            let tag = after[i]['tags'][tag_key];
            if (!table[i][tag_key]) {
                let tag_dict = {...tag};
                delete tag_dict['data'];
                table[i][tag_key] = tag_dict;
                
            }
            table[i][tag_key]['after'] = tag['data'];
        }
    }

    let final_table = [];

    for (let i = 0; i < Object.keys(table).length; i++) {
        for (let tag_key in table[i]) {
            let row = {...table[i][tag_key]};
            row['ifd'] = i;
            row['tag'] = tag_key;
            if (!row['name']) {
                row['name'] = tiff_tags[tag_key] && tiff_tags[tag_key].name;
            }
            row['diff'] = are_values_diff(row['prior'], row['after']);
            
            final_table.push(row);
        }
    }

    return final_table;
}

function extractPreviewMetadataArrays(response) {
    if (!response) {
        return { prior_ifds: null, new_ifds: null };
    }
    if (Array.isArray(response.prior_ifds) || Array.isArray(response.new_ifds)) {
        return {
            prior_ifds: response.prior_ifds,
            new_ifds: response.new_ifds,
        };
    }
    const response_object = structToObject(response);
    return {
        prior_ifds: response_object.prior_ifds ?? response_object.priorIfds,
        new_ifds: response_object.new_ifds ?? response_object.newIfds,
    };
}

function* watch_preview_metadata() {
    while (true) {
        const {payload} = yield take(preview_actions.GET_METADATA_PREVIEW);
        const {row_idx, file_row} = payload;

        const config = yield select(state => state.config);
        const tiff_tags = yield select(state => state.viewer.tiff_tags);

        if (!file_row || !file_row.__reserved) {
            logMetadataPreview('saga-skip', { reason: 'missing_file_row' });
            continue;
        }

        const sourcePath = file_row.__reserved.source?.path;

        let info = {
            config: config,
            ...file_row,
            __reserved: file_row.__reserved,
        };

        try {
            logMetadataPreview('saga-start', {
                path: sourcePath,
                row_idx,
                processed: file_row.__reserved.processed,
            });

            const response = yield call(electronAPI.previewMetadata, info);
            const { prior_ifds, new_ifds } = extractPreviewMetadataArrays(response);

            if (!Array.isArray(prior_ifds) || !Array.isArray(new_ifds)) {
                logMetadataPreview('saga-fail', {
                    path: sourcePath,
                    reason: 'missing_ifds',
                    priorType: typeof prior_ifds,
                    newType: typeof new_ifds,
                    responseKeys: response && typeof response === 'object' ? Object.keys(response) : [],
                });
                continue;
            }

            convert_json_ifds(prior_ifds);
            convert_json_ifds(new_ifds);

            const table = setup_table(tiff_tags, {prior: prior_ifds, after: new_ifds});

            logMetadataPreview('saga-ok', {
                path: sourcePath,
                priorLen: prior_ifds.length,
                newLen: new_ifds.length,
                tableRowCount: Array.isArray(table) ? table.length : 0,
            });

            yield put({
                type: preview_actions.SET_METADATA_PREVIEW,
                payload: { path: sourcePath, row_idx: row_idx, table: table },
            });
        } catch (error) {
            logMetadataPreview('saga-catch', {
                path: sourcePath,
                message: error?.message ?? String(error),
            });
        }
    }
}

export default watch_preview_metadata
