export function makeEsmSearchRow() {
    const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    return { id, accession: '', blockId: '', deid: '', stain: '' };
}

const default_state = {
    url: '',
    username: '',
    password: '',
    authenticated: false,
    authToken: null,
    loading: false,
    error: false,
    errorMessage: null,
    searchLoading: false,
    searchError: false,
    searchErrorMessage: null,

    // Staged search criteria (batch eSM search wiring is a follow-up)
    searchRows: [makeEsmSearchRow()],

    // Search results + selection + filename mapping
    results: [],
    /** @type {Record<string, object[]>} keys: normalizeAccessionKey(accession) */
    slidesByAccession: {},
    selectedIds: [],
    // Persisted site-specific normalization rules
    transformRules: [],
    // Selected rules for current eSM session (order matters)
    selectedTransformRuleIds: [],
    mappingConfig: {
        accessionMode: "original", // "original" | "manual" | "auto"
        accessionToken: "", // used when accessionMode === "manual"
        // ordered list of fields to include in filename (joined with "_")
        fieldsOrder: ["Accession", "BlockId", "StainId", "SlideNum"],
        duplicateStrategy: "suffix-index", // "suffix-index" | "skip-duplicates"
        /** When criteria stain is empty, transformed StainId must match this regex (if non-empty). */
        resultsFilterRegex: "",
    },
};

export default default_state;
