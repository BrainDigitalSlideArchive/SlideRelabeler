import React, { useState } from 'react';
import { useSelector, useDispatch } from "react-redux";

import * as esm_actions from "../../actions/esm";

import ModalHeader from './ModalHeader';
import InputText from '../../components/controls/input/InputText';
import Button from '../../components/controls/button/Button';
import Dropdown from '../../components/controls/dropdown/Dropdown';
import ESMAgGrid from '../../components/AgGrid/ESMAgGrid';
import { applyRules, getSelectedTransformRules } from '../../helpers/esm_transform_rules';

/**
 * Modal component for eSlideManager integration
 * Allows users to connect to eSlideManager and search for slides by accession number
 */
function ModalESlideManager(props) {
  const url = useSelector(state => state.esm.url);
  const username = useSelector(state => state.esm.username);
  const password = useSelector(state => state.esm.password);
  const authenticated = useSelector(state => state.esm.authenticated);
  const loading = useSelector(state => state.esm.loading);
  const error = useSelector(state => state.esm.error);
  const errorMessage = useSelector(state => state.esm.errorMessage);
  const searchLoading = useSelector(state => state.esm.searchLoading);
  const searchError = useSelector(state => state.esm.searchError);
  const searchErrorMessage = useSelector(state => state.esm.searchErrorMessage);
  const processing = useSelector(state => state.files.processing);
  const disable_changes = useSelector(state => state.files.disable_changes);
  const results = useSelector(state => state.esm.results);
  const selectedIds = useSelector(state => state.esm.selectedIds);
  const mappingConfig = useSelector(state => state.esm.mappingConfig);
  const transformRules = useSelector(state => state.esm.transformRules) || [];
  const selectedTransformRuleIds = useSelector(state => state.esm.selectedTransformRuleIds) || [];

  const dispatch = useDispatch();

  const [accession, setAccession] = useState('');
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [testInput, setTestInput] = useState("");

  const handleSearch = () => {
    if (accession.trim() && authenticated) {
      dispatch({ type: esm_actions.ESM_SEARCH, payload: accession.trim() });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && accession.trim() && authenticated && !loading && !searchLoading) {
      handleSearch();
    }
  };

  const handlePasswordKeyPress = (e) => {
    if (e.key === 'Enter' && username !== '' && password !== '' && !authenticated && !loading && !disable_changes) {
      dispatch({ type: esm_actions.ESM_LOGIN });
    }
  };

  const hasResults = Array.isArray(results) && results.length > 0;
  const selectedRules = getSelectedTransformRules(transformRules, selectedTransformRuleIds);
  const testOutput = applyRules(testInput, selectedRules);

  function makeId() {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function toggleSelectedRule(id) {
    const current = Array.isArray(selectedTransformRuleIds) ? selectedTransformRuleIds : [];
    const exists = current.includes(id);
    const next = exists ? current.filter((x) => x !== id) : [...current, id];
    dispatch({ type: esm_actions.ESM_SET_SELECTED_TRANSFORM_RULE_IDS, payload: next });
  }

  function moveSelectedRule(id, dir) {
    const current = Array.isArray(selectedTransformRuleIds) ? [...selectedTransformRuleIds] : [];
    const idx = current.indexOf(id);
    if (idx === -1) return;
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= current.length) return;
    const tmp = current[idx];
    current[idx] = current[nextIdx];
    current[nextIdx] = tmp;
    dispatch({ type: esm_actions.ESM_SET_SELECTED_TRANSFORM_RULE_IDS, payload: current });
  }

  const accessionModeItems = [
    { label: "Original accession", value: "original" },
    { label: "Manual token", value: "manual" },
    { label: "Auto token", value: "auto" },
  ];

  const duplicateStrategyItems = [
    { label: "Add numeric suffix", value: "suffix-index" },
    { label: "Skip duplicates", value: "skip-duplicates" },
  ];

  const filenameFieldItems = [
    { label: "Accession", value: "Accession" },
    { label: "BlockId", value: "BlockId" },
    { label: "StainId", value: "StainId" },
    { label: "SlideNum", value: "SlideNum" },
  ];

  const selectedFieldItems = (mappingConfig?.fieldsOrder || [])
    .map((v) => filenameFieldItems.find((x) => x.value === v))
    .filter(Boolean);

  const selectedAccessionMode = accessionModeItems.find((x) => x.value === (mappingConfig?.accessionMode || "original")) || accessionModeItems[0];
  const selectedDupStrategy = duplicateStrategyItems.find((x) => x.value === (mappingConfig?.duplicateStrategy || "suffix-index")) || duplicateStrategyItems[0];

  const applySelectionDisabled = !hasResults || !Array.isArray(selectedIds) || selectedIds.length === 0;

  return (
    <div className="__modal">
      <ModalHeader title={"eSlideManager"} type={"esm"} />
      <div className={"__content"}>
        <div className={"__divider"} />
        <div className={"__config-controls"}>
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>Connection Settings</div>
            <div className={"__config-control-section-description"}>
              Enter your eSlideManager URL and credentials to search for slides.
            </div>
            <div className={"__config-control-section-dsa-group"}>
              <div className={"__config-control-section-dsa-subgroup"}>
                <InputText 
                  disabled={authenticated || disable_changes} 
                  error={error} 
                  label={"API URL"} 
                  value={url} 
                  onChange={(new_value) => dispatch({ type: esm_actions.SET_ESM_URL, payload: new_value })} 
                />
                <InputText 
                  disabled={authenticated || disable_changes} 
                  error={error} 
                  label={"Username"} 
                  value={username} 
                  onChange={(new_value) => dispatch({ type: esm_actions.SET_ESM_USERNAME, payload: new_value })} 
                />
                <InputText 
                  disabled={authenticated || disable_changes} 
                  error={error} 
                  type={"password"} 
                  label={"Password"} 
                  value={password} 
                  onChange={(new_value) => dispatch({ type: esm_actions.SET_ESM_PASSWORD, payload: new_value })} 
                  onKeyPress={handlePasswordKeyPress}
                />
                {
                  !authenticated ?
                    <Button 
                      extra_class_name={"_align-center"} 
                      disabled={!(username !== '' && password !== '' && !authenticated && !loading && !disable_changes)} 
                      text={loading ? "Logging in..." : "Login"} 
                      onClick={() => dispatch({ type: esm_actions.ESM_LOGIN })} 
                    /> :
                    <Button 
                      extra_class_name={"_align-center"} 
                      disabled={!(username !== '' && password !== '' && authenticated && !disable_changes)} 
                      text={"Logout"} 
                      onClick={() => dispatch({ type: esm_actions.ESM_LOGOUT })} 
                    />
                }
                {
                  error && <div className={"__config-control-section-error"}>{errorMessage}</div>
                }
              </div>
              <div className={"__config-control-section-dsa-subgroup"}>
                {
                  authenticated &&
                  <div className={"__dsa-auth-group"}>
                    <div className={"__dsa-auth-item"}>
                      <div className={"__dsa-auth-item-label"}>
                        API URL:
                      </div>
                      <div className={"__dsa-auth-item-value"}>
                        {url}
                      </div>
                    </div>
                    <div className={"__dsa-auth-item"}>
                      <div className={"__dsa-auth-item-label"}>
                        Username:
                      </div>
                      <div className={"__dsa-auth-item-value"}>
                        {username}
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
          <div className={"__divider"} />
          <div className={"__config-control-section"}>
            <div className={"__config-control-section-title"}>Search for Slides</div>
            <div className={"__config-control-section-description"}>
              Enter an accession number to search for slides. Results will populate a staging table for selection + filename mapping.
            </div>
            <div className={"__config-control-section-group"}>
              <InputText 
                disabled={!authenticated || disable_changes || searchLoading} 
                error={searchError} 
                label={"Accession Number"} 
                value={accession} 
                onChange={(new_value) => setAccession(new_value)}
                onKeyPress={handleKeyPress}
              />
              <Button 
                disabled={!authenticated || !accession.trim() || disable_changes || searchLoading} 
                text={searchLoading ? "Searching..." : "Search"} 
                onClick={handleSearch} 
              />
            </div>
            {
              searchError && <div className={"__config-control-section-error"}>{searchErrorMessage}</div>
            }
          </div>

          {
            hasResults &&
            <>
              <div className={"__divider"} />
              <div className={"__config-control-section"}>
                <div className={"__config-control-section-title"}>Filename mapping</div>
                <div className={"__config-control-section-description"}>
                  Choose how imported eSM slides should be renamed before they’re added to the main processing list.
                </div>

                <div className={"__config-control-section-group"}>
                  <Dropdown
                    label={"Accession token"}
                    disabled={false}
                    items={accessionModeItems}
                    selectedItems={[selectedAccessionMode]}
                    onSelect={(item) => dispatch({ type: esm_actions.ESM_SET_MAPPING_CONFIG, payload: { accessionMode: item.value } })}
                    placeholder={"Select accession mode"}
                    multiSelect={false}
                  />
                  <Dropdown
                    label={"Duplicate handling"}
                    disabled={false}
                    items={duplicateStrategyItems}
                    selectedItems={[selectedDupStrategy]}
                    onSelect={(item) => dispatch({ type: esm_actions.ESM_SET_MAPPING_CONFIG, payload: { duplicateStrategy: item.value } })}
                    placeholder={"Select strategy"}
                    multiSelect={false}
                  />
                </div>

                {
                  (mappingConfig?.accessionMode === "manual") &&
                  <div className={"__config-control-section-group"}>
                    <InputText
                      label={"Manual accession token"}
                      value={mappingConfig?.accessionToken || ""}
                      onChange={(new_value) => dispatch({ type: esm_actions.ESM_SET_MAPPING_CONFIG, payload: { accessionToken: new_value } })}
                      disabled={false}
                      tooltip={"This replaces the original accession in filenames for all selected slides."}
                    />
                  </div>
                }

                <div className={"__config-control-section-group"}>
                  <Dropdown
                    label={"Filename fields"}
                    disabled={false}
                    items={filenameFieldItems}
                    selectedItems={selectedFieldItems}
                    onSelect={(item) => {
                      const current = Array.isArray(mappingConfig?.fieldsOrder) ? mappingConfig.fieldsOrder : [];
                      const exists = current.includes(item.value);
                      const next = exists ? current.filter((x) => x !== item.value) : [...current, item.value];
                      dispatch({ type: esm_actions.ESM_SET_MAPPING_CONFIG, payload: { fieldsOrder: next } });
                    }}
                    placeholder={"Select fields"}
                    multiSelect={true}
                  />
                </div>

                <div className={"__config-control-section-group"}>
                  <Button
                    disabled={applySelectionDisabled}
                    text={`Add selected (${selectedIds?.length || 0}) to file list`}
                    onClick={() => dispatch({ type: esm_actions.ESM_APPLY_SELECTION })}
                  />
                  <Button
                    disabled={false}
                    text={"Clear results"}
                    onClick={() => dispatch({ type: esm_actions.ESM_CLEAR_RESULTS })}
                  />
                </div>

                <ESMAgGrid
                  autoSizeStrategy={{type: 'fitCellContents'}}
                  suppressMovableColumns={true}
                  ensureDomOrder={true}
                  suppressDragLeaveHidesColumns={true}
                  enableCellTextSelection={true}
                />

                <div className={"__config-control-section-description"}>
                  Tip: use the table filters to narrow results, then check the header checkbox to select all visible rows.
                </div>
              </div>

              <div className={"__divider"} />
              <div className={"__config-control-section"}>
                <div className={"__config-control-section-title"}>Transform rules (site-specific)</div>
                <div className={"__config-control-section-description"}>
                  Define simple find/replace rules to normalize eSM field values before filenames are generated. Selected rules apply to the TargetFilename preview and to items added to the processing list.
                </div>

                <div className={"__config-control-section-group"}>
                  <Button
                    disabled={false}
                    text={"Add rule"}
                    onClick={() => {
                      const id = makeId();
                      const rule = { id, name: "New rule", enabled: true, steps: [{ find: "", replace: "", matchMode: "all", caseSensitive: true }] };
                      dispatch({ type: esm_actions.ESM_ADD_TRANSFORM_RULE, payload: rule });
                      setEditingRuleId(id);
                    }}
                  />
                  <Button
                    disabled={selectedTransformRuleIds.length === 0}
                    text={"Clear selected rules"}
                    onClick={() => dispatch({ type: esm_actions.ESM_SET_SELECTED_TRANSFORM_RULE_IDS, payload: [] })}
                  />
                </div>

                <div className={"__config-control-section-group"} style={{ gap: "12px", flexDirection: "column", alignItems: "stretch" }}>
                  {(Array.isArray(transformRules) ? transformRules : []).map((rule) => {
                    const selected = Array.isArray(selectedTransformRuleIds) && selectedTransformRuleIds.includes(rule.id);
                    const isEditing = editingRuleId === rule.id;
                    return (
                      <div key={rule.id} style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 6, padding: 10 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleSelectedRule(rule.id)}
                            />
                            <span style={{ fontWeight: 600 }}>{rule.name || "(unnamed rule)"}</span>
                            <span style={{ opacity: 0.7 }}>{rule.enabled === false ? "(disabled)" : ""}</span>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <Button disabled={!selected} text={"Up"} onClick={() => moveSelectedRule(rule.id, -1)} />
                            <Button disabled={!selected} text={"Down"} onClick={() => moveSelectedRule(rule.id, 1)} />
                            <Button disabled={false} text={isEditing ? "Close" : "Edit"} onClick={() => setEditingRuleId(isEditing ? null : rule.id)} />
                            <Button disabled={false} text={"Delete"} onClick={() => dispatch({ type: esm_actions.ESM_DELETE_TRANSFORM_RULE, payload: rule.id })} />
                          </div>
                        </div>

                        {isEditing && (
                          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                            <InputText
                              label={"Rule name"}
                              value={rule.name || ""}
                              onChange={(v) => dispatch({ type: esm_actions.ESM_UPDATE_TRANSFORM_RULE, payload: { id: rule.id, name: v } })}
                            />
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                <input
                                  type="checkbox"
                                  checked={rule.enabled !== false}
                                  onChange={() => dispatch({ type: esm_actions.ESM_UPDATE_TRANSFORM_RULE, payload: { id: rule.id, enabled: rule.enabled === false } })}
                                />
                                Enabled
                              </label>
                              <Button
                                disabled={false}
                                text={"Add step"}
                                onClick={() => {
                                  const steps = Array.isArray(rule.steps) ? rule.steps : [];
                                  dispatch({ type: esm_actions.ESM_UPDATE_TRANSFORM_RULE, payload: { id: rule.id, steps: [...steps, { find: "", replace: "", matchMode: "all", caseSensitive: true }] } });
                                }}
                              />
                            </div>

                            {(Array.isArray(rule.steps) ? rule.steps : []).map((step, idx) => (
                              <div key={idx} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                <InputText
                                  label={`Find (${idx + 1})`}
                                  value={step?.find ?? ""}
                                  onChange={(v) => {
                                    const steps = Array.isArray(rule.steps) ? [...rule.steps] : [];
                                    steps[idx] = { ...steps[idx], find: v };
                                    dispatch({ type: esm_actions.ESM_UPDATE_TRANSFORM_RULE, payload: { id: rule.id, steps } });
                                  }}
                                />
                                <InputText
                                  label={"Replace"}
                                  value={step?.replace ?? ""}
                                  onChange={(v) => {
                                    const steps = Array.isArray(rule.steps) ? [...rule.steps] : [];
                                    steps[idx] = { ...steps[idx], replace: v };
                                    dispatch({ type: esm_actions.ESM_UPDATE_TRANSFORM_RULE, payload: { id: rule.id, steps } });
                                  }}
                                />
                                <Dropdown
                                  label={"Mode"}
                                  disabled={false}
                                  items={[{ label: "All", value: "all" }, { label: "First", value: "first" }]}
                                  selectedItems={[{ label: (step?.matchMode === "first" ? "First" : "All"), value: (step?.matchMode === "first" ? "first" : "all") }]}
                                  onSelect={(item) => {
                                    const steps = Array.isArray(rule.steps) ? [...rule.steps] : [];
                                    steps[idx] = { ...steps[idx], matchMode: item.value };
                                    dispatch({ type: esm_actions.ESM_UPDATE_TRANSFORM_RULE, payload: { id: rule.id, steps } });
                                  }}
                                  placeholder={"Mode"}
                                  multiSelect={false}
                                />
                                <label style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 22 }}>
                                  <input
                                    type="checkbox"
                                    checked={step?.caseSensitive !== false}
                                    onChange={() => {
                                      const steps = Array.isArray(rule.steps) ? [...rule.steps] : [];
                                      steps[idx] = { ...steps[idx], caseSensitive: !(step?.caseSensitive !== false) };
                                      dispatch({ type: esm_actions.ESM_UPDATE_TRANSFORM_RULE, payload: { id: rule.id, steps } });
                                    }}
                                  />
                                  Case sensitive
                                </label>
                                <Button
                                  disabled={false}
                                  text={"Remove"}
                                  onClick={() => {
                                    const steps = Array.isArray(rule.steps) ? [...rule.steps] : [];
                                    steps.splice(idx, 1);
                                    dispatch({ type: esm_actions.ESM_UPDATE_TRANSFORM_RULE, payload: { id: rule.id, steps } });
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className={"__config-control-section-title"} style={{ marginTop: 12 }}>Live test</div>
                <div className={"__config-control-section-description"}>
                  Use this to quickly validate the currently selected rules. For end-to-end testing, use the eSM search above and watch the TargetFilename preview column update.
                </div>
                <div className={"__config-control-section-group"}>
                  <InputText label={"Test input"} value={testInput} onChange={setTestInput} />
                  <InputText label={"Test output"} value={testOutput} onChange={() => {}} disabled={true} />
                </div>
              </div>
            </>
          }
        </div>
      </div>
      <div className={"__footer"}>
      </div>
    </div>
  );
}

export default ModalESlideManager;
