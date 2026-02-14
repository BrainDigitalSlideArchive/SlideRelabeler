import { put, take, select } from 'redux-saga/effects';
import { return_filename_dir_from_path, return_separator } from "../../helpers/renderer_path_helpers";
import get_uuid from "../files/get_uuid";
import * as esm_actions from '../../actions/esm';
import * as files_actions from '../../actions/files';
import * as modal_actions from '../../actions/modal';

/**
 * Transform a slide object from eSlideManager into a file row for the application
 * @param {Object} slide - Slide object from eSlideManager API
 * @returns {Object|null} File row object or null if invalid
 */
function* transformSlideToFileRow(slide) {
    // Extract accession from BarcodeId (format: "ACCESSION;s1;INSTITUTION")
    const accession = slide.BarcodeId ? slide.BarcodeId.split(';')[0] : '';
    
    // Get file path from CompressedFileLocation
    const file_path = slide.CompressedFileLocation || '';
    
    if (!file_path) {
        return null;
    }

    // Parse file path
    const { filename, directory } = return_filename_dir_from_path(file_path);
    const path_sep = return_separator();
    const ext = filename.split('.').pop();
    const name = filename.split('.').shift();

    // Create source object
    let source = {
        filename: filename,
        directory: directory,
        path: file_path,
        parsed: {
            ext: '.' + ext,
            dir: directory,
            base: filename,
            name: name,
            root: directory.split(path_sep).shift()
        },
        sep: path_sep
    };

    // Get UUID for the file
    const file_uuid = yield get_uuid(file_path);

    // Create file row with all slide data
    let file_row = {
        Accession: accession,
        BlockId: slide.BlockId || '',
        StainId: slide.StainId || '',
        CompressedFileLocation: slide.CompressedFileLocation || '',
        SlideNum: slide.SlideNum || '',
        ImageId: slide.ImageId || '',
        SlideId: slide.SlideId || '',
        ScanDate: slide.ScanDate || '',
        __reserved: {
            source: source,
            uuid: file_uuid,
            rename: filename,
            processed: 0
        }
    };

    // Set destination directory (always set, matching Add Files behavior)
    const output_dir = yield select(state => state.files.output_dir);
    file_row.__reserved.destinationDirectory = output_dir; // Can be null

    return file_row;
}

/**
 * Search saga - handles eSlideManager slide search
 * @param {string} url - eSlideManager API URL
 * @param {string} username - Username
 * @param {string} password - Password
 * @param {string} accession - Accession number to search for
 */
function* search(url, username, password, accession) {
    yield put({ type: esm_actions.ESM_SEARCH, payload: accession });
    try {
        const response = yield electronAPI.esmSearchAccession(url, username, password, accession);
        
        if (response[0]) {
            const slides = response[1];
            
            if (!slides || slides.length === 0) {
                yield put({ type: esm_actions.ESM_SEARCH_ERROR, payload: 'No slides found for accession: ' + accession });
                yield put({ type: modal_actions.DISPLAY_ERROR_MESSAGE, payload: 'No slides found for accession: ' + accession });
                return;
            }

            // Transform slides to file rows
            const file_rows = [];
            for (const slide of slides) {
                const file_row = yield transformSlideToFileRow(slide);
                if (file_row) {
                    file_rows.push(file_row);
                }
            }

            if (file_rows.length > 0) {
                // Add file rows to the table
                yield put({ type: files_actions.ADD_FILE_ROWS, payload: file_rows });
                // Trigger metadata processing (thumbnails, file size, etc.)
                yield put({ type: files_actions.UPDATE_FILES_WITHOUT_METADATA });
                yield put({ type: esm_actions.ESM_SEARCH_SUCCESS });
                yield put({ type: modal_actions.TOGGLE_MODAL, payload: { type: 'esm' } }); // Close modal on success
            } else {
                yield put({ type: esm_actions.ESM_SEARCH_ERROR, payload: 'No valid file paths found in search results' });
                yield put({ type: modal_actions.DISPLAY_ERROR_MESSAGE, payload: 'No valid file paths found in search results' });
            }
        } else {
            const errorMessage = response[1].message || 'Search failed';
            yield put({ type: esm_actions.ESM_SEARCH_ERROR, payload: errorMessage });
            yield put({ type: modal_actions.DISPLAY_ERROR_MESSAGE, payload: errorMessage });
        }
    } catch (error) {
        const errorMessage = error.message || 'Search failed';
        yield put({ type: esm_actions.ESM_SEARCH_ERROR, payload: errorMessage });
        yield put({ type: modal_actions.DISPLAY_ERROR_MESSAGE, payload: errorMessage });
    }
}

function* watch_search() {
    while (true) {
        const action = yield take(esm_actions.ESM_SEARCH);
        const username = yield select(state => state.esm.username);
        const password = yield select(state => state.esm.password);
        const url = yield select(state => state.esm.url);
        const accession = action.payload;
        yield search(url, username, password, accession);
    }
}

export default watch_search;
