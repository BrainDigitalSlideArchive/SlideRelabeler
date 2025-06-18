import {take, put, call, select} from 'redux-saga/effects'

import * as preview_actions from '../../actions/preview';

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

function* watch_preview_metadata() {
    while (true) {
        const {payload} = yield take(preview_actions.GET_METADATA_PREVIEW);
        const {row_idx, file_row} = payload;

        const config = yield select(state => state.config);
        const tiff_tags = yield select(state => state.viewer.tiff_tags);

        let info = {
        config: config,
        ...file_row
        };

        const response = yield call(electronAPI.previewMetadata, info);

        let prior_ifds = response[0];
        let new_ifds = response[1];

        convert_json_ifds(prior_ifds);
        convert_json_ifds(new_ifds);

        const table = setup_table(tiff_tags, {prior: prior_ifds, after: new_ifds});

        yield put({type: preview_actions.SET_METADATA_PREVIEW, payload: {path: file_row.__reserved.source.path, row_idx: row_idx, table: table}});
    }
}

export default watch_preview_metadata