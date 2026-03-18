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

    // Search results + selection + filename mapping
    results: [],
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
    },
};

export default default_state;
