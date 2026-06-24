import { makeEsmProfile, ESM_STAIN_FILTER_ALL, defaultStainForNewSearchRow } from '../../helpers/esm_profile_helpers';
import { makeEmptySearchFeedback } from '../../helpers/esm_search_feedback';

export function makeEsmSearchRow(profile = null) {
    const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const stainDefaults = profile
        ? defaultStainForNewSearchRow(profile)
        : { stainMode: ESM_STAIN_FILTER_ALL, stain: '' };
    return {
        id,
        accession: '',
        blockId: '',
        deid: '',
        stainMode: stainDefaults.stainMode,
        stain: stainDefaults.stain,
    };
}

const defaultProfile = makeEsmProfile({
    name: 'Default',
    description: '',
    url: '',
});

const default_state = {
    integrationEnabled: true,
    rememberUsername: false,
    username: '',
    password: '',
    profiles: [defaultProfile],
    activeProfileId: defaultProfile.id,
    authenticated: false,
    authToken: null,
    loading: false,
    error: false,
    errorMessage: null,
    searchLoading: false,
    searchFeedback: makeEmptySearchFeedback(),

    searchRows: [makeEsmSearchRow()],

    results: [],
    /** @type {Record<string, object[]>} keys: normalizeAccessionKey(accession) */
    slidesByAccession: {},
    selectedIds: [],
};

export default default_state;
