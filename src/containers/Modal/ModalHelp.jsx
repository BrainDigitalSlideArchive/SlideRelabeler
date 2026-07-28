import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as modal_actions from '../../actions/modal';
import ModalHeader from './ModalHeader';
import { openConfigSettings } from '../../components/config-v2/ConfigV2Nav';
import { useAppVersion } from '../../helpers/useAppVersion';

import './ModalHelp.scss';

const GITHUB_REPO_URL = 'https://github.com/BrainDigitalSlideArchive/SlideRelabeler';

/** Top-level Help sections for the Quick Start Guide TOC. */
const HELP_TOC = [
  { id: 'help-section-loading', label: 'Loading slides' },
  { id: 'help-section-file-list', label: 'The file list' },
  { id: 'help-section-inspecting', label: 'Slide Viewer: Inspecting WSIs' },
  { id: 'help-section-delivery', label: 'Where files go' },
  { id: 'help-section-running', label: 'Running a job' },
  { id: 'help-section-settings', label: 'Settings' },
  { id: 'help-section-feedback', label: 'Feedback' },
];

const SETTINGS_LINKS = [
  {
    id: 'config-overview',
    label: 'Overview',
    detail: 'how de-identification works, plus a glossary of terms',
  },
  {
    id: 'config-output-filename',
    label: 'Output name',
    detail: 'UUID, keep original filename, or custom patterns',
  },
  {
    id: 'config-slide-label',
    label: 'Slide label',
    detail: 'label text, QR content, and optional icon',
  },
  {
    id: 'config-data-loading',
    label: 'Data loading',
    detail: 'file picker, CSV column mapping, and API integrations such as eSlideManager',
  },
  {
    id: 'config-output-delivery',
    label: 'Output delivery',
    detail: 'default local folder, DSA and Globus upload setup, and staging options',
  },
  {
    id: 'config-audit-logging',
    label: 'Audit logging',
    detail: 'in-app processing history; export to CSV on demand (nothing is written automatically to the output folder)',
  },
  {
    id: 'config-advanced',
    label: 'Advanced',
    detail: 'keep macro image, troubleshooting tools, startup disclaimer, restore defaults, and clear saved data',
  },
  {
    id: 'config-profiles',
    label: 'Profiles',
    detail: 'save, switch, export, and import configuration profiles',
  },
];

function SettingsLink({ sectionId, children }) {
  const dispatch = useDispatch();
  return (
    <button
      type="button"
      className="modal-help__inline-link"
      onClick={() => openConfigSettings(dispatch, sectionId)}
    >
      {children}
    </button>
  );
}

/** Soft chip for in-app UI labels (columns, buttons, panels). Prefer over bold. */
function Ui({ children }) {
  return <span className="modal-help__ui">{children}</span>;
}

function scrollToHelpSection(id) {
  const el = document.getElementById(id);
  if (el && typeof el.scrollIntoView === 'function') {
    el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
}

function ModalHelp() {
  const dispatch = useDispatch();
  const helpFocusSection = useSelector((s) => s.modal.helpFocusSection);
  const applicationSectionRef = useRef(null);
  const appVersion = useAppVersion();

  useEffect(() => {
    if (helpFocusSection !== 'application') return;
    const el = applicationSectionRef.current;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
    dispatch({ type: modal_actions.CLEAR_HELP_FOCUS_SECTION });
  }, [helpFocusSection, dispatch]);

  return (
    <div className="__modal modal-help">
      <ModalHeader title="Help" type="help" />
      <div className="__content __content--config">
        <div className="config-panel">
          <div className="config-panel__body modal-help__body">
            <div
              className="__content-section"
              id="help-section-application"
              ref={applicationSectionRef}
            >
              <h2>Application Disclaimer</h2>
              {appVersion ? (
                <p className="modal-help__version">
                  SlideRelabeler <span className="modal-help__version-num">{appVersion}</span>
                </p>
              ) : null}
              <p>
                SlideRelabeler is an open-source application intended to help remove identifying information from
                whole slide images so they can be shared appropriately. It provides no guarantee that all patient
                identifiers are automatically removed.{' '}
                <b>
                  The developers are not liable for a failure to fully de-identify any given whole slide image file.
                </b>{' '}
                You alone are responsible for ensuring adequate de-identification for your use case before sharing
                resulting files. Because imaging practices differ across institutions, verify that outputs meet your
                requirements. If something fails to de-identify as expected, please share reproducible details so the
                application can be improved.
              </p>
              <p>
                You can change whether this disclaimer appears every time the app starts in{' '}
                <SettingsLink sectionId="config-advanced">Settings → Advanced</SettingsLink>
                {' '}(Startup disclaimer).
              </p>
            </div>

            <div className="modal-help__guide-header">
              <h2>Quick Start Guide</h2>
              <p>
                The sections below walk through loading slides, reviewing them, delivering outputs, and finding more
                detail in Settings.
              </p>
            </div>

            <nav className="modal-help__toc" aria-label="What is in this guide">
              <p className="modal-help__toc-label">What&apos;s in this guide</p>
              <ul className="modal-help__toc-list">
                {HELP_TOC.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="modal-help__inline-link"
                      onClick={() => scrollToHelpSection(item.id)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="__content-section" id="help-section-loading">
              <h2>Loading slides</h2>
              <p>
                Whole slide image (WSI) files can be loaded into the application in several ways:
              </p>
              <ul className="modal-help__bullets">
                <li>
                  You can use the <Ui>Files</Ui> or <Ui>Folder</Ui> actions to pick slides directly from this
                  computer or attached network drives. Use the dropdown to switch between Files and Folder, then
                  click the icon on the right of the control to open the system picker dialog.
                </li>
                <li>
                  Another method is <Ui>CSV Import</Ui>. With a spreadsheet, you can define the location and
                  filename of many files at once, along with other columns the application can use (for example
                  output names or label text). Column mapping and a sample template live under{' '}
                  <SettingsLink sectionId="config-data-loading">Settings → Data loading</SettingsLink>.
                </li>
                <li>
                  You can also load slides from a connected system, such as eSlideManager. First enable the
                  integration under{' '}
                  <SettingsLink sectionId="config-data-loading">Settings → Data loading</SettingsLink>
                  , then use the toolbar control next to <Ui>CSV Import</Ui> to open that system and add slides.
                </li>
              </ul>
            </div>

            <div className="__content-section" id="help-section-file-list">
              <h2>The file list</h2>
              <p>
                Loaded slides appear in the file list on the main window—one row per WSI. You can use this table
                to understand what you loaded and to adjust how each slide will be de-identified:
              </p>
              <ul className="modal-help__bullets">
                <li>
                  Click the thumbnail and filename in the <Ui>Original file</Ui> column to open the Viewer and
                  look at the slide in detail (including its current label and related images).
                </li>
                <li>
                  The <Ui>Images</Ui> column shows which associated images are present in the file today (for
                  example label or macro), so you can see what the source file already contains.
                </li>
                <li>
                  Many cells are editable: click a value such as <Ui>Output name</Ui>, <Ui>Label</Ui>, or{' '}
                  <Ui>QR</Ui> and change it directly in the table. Those edits can change the replacement label
                  and the name of the de-identified file.
                </li>
                <li>
                  <Ui>Copy To</Ui> lets you choose a per-row destination folder when you are saving locally,
                  instead of using only the default folder from Output delivery.
                </li>
              </ul>
            </div>

            <div className="__content-section" id="help-section-inspecting">
              <h2>Slide Viewer: Inspecting WSIs</h2>
              <p>
                You can open any loaded slide in the Viewer to inspect the original file and to preview how
                de-identification will look—or to review what it produced after processing.
              </p>
              <ul className="modal-help__bullets">
                <li>
                  In the file list, click the thumbnail and filename in the <Ui>Original file</Ui> column to open
                  the Viewer. The main area shows the whole-slide image so you can pan and zoom.
                </li>
                <li>
                  The side panel lists associated images in two columns: <Ui>Current</Ui> (what is in the source
                  file) and <Ui>After</Ui> (the planned or resulting replacements, such as the new label). Click a
                  thumbnail in that panel to enlarge it.
                </li>
                <li>
                  Use <Ui>Compare</Ui> to review the slide&apos;s internal metadata before and after
                  de-identification, side by side. This is separate from any extra columns that appear in the file
                  list from CSV import or an API integration.
                </li>
              </ul>
              <p>
                Checking these views is a good way to confirm that outputs look right for your use case before you
                share them.
              </p>
            </div>

            <div className="__content-section" id="help-section-delivery">
              <h2>Where files go</h2>
              <p>
                Decide where de-identified copies should go using the <Ui>Output delivery</Ui> panel on the main
                window:
              </p>
              <ul className="modal-help__bullets">
                <li>
                  <Ui>Save locally</Ui> writes files to a folder on this computer (or a network location you
                  choose). You can set a default folder here for the session, and individual rows can still
                  override that with <Ui>Copy To</Ui>.
                </li>
                <li>
                  <Ui>Upload</Ui> sends finished files to a remote destination such as the Digital Slide Archive
                  (DSA) or Globus, when those integrations are enabled. Defaults and connection details are
                  configured under{' '}
                  <SettingsLink sectionId="config-output-delivery">Settings → Output delivery</SettingsLink>
                  ; the panel on the main window controls what happens for the current session.
                </li>
              </ul>
            </div>

            <div className="__content-section" id="help-section-running">
              <h2>Running a job</h2>
              <p>
                At least one delivery path (local save and/or upload) must be ready before processing can start.
                When you are ready, use <Ui>Process Files</Ui>, or <Ui>Process and Upload</Ui> if Upload is turned
                on. The <Ui>Progress</Ui> panel shows how the session is going. <Ui>Clear Files</Ui> removes
                everything from the list; while a run is active, that control becomes <Ui>Cancel</Ui> so you can
                stop the current job.
              </p>
            </div>

            <div className="__content-section" id="help-section-settings">
              <h2>Settings</h2>
              <p>
                Open <Ui>Settings</Ui> from the main toolbar for defaults and integrations. Each section below jumps
                straight to that part of Settings:
              </p>
              <ul className="modal-help__link-list">
                {SETTINGS_LINKS.map((item) => (
                  <li key={item.id}>
                    <SettingsLink sectionId={item.id}>{item.label}</SettingsLink>
                    {' — '}
                    {item.detail}
                  </li>
                ))}
              </ul>
            </div>

            <div className="__content-section" id="help-section-feedback">
              <h2>Feedback</h2>
              <p>
                Report bugs or suggest improvements on the{' '}
                <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
                  SlideRelabeler GitHub repository
                </a>
                . Include enough detail to reproduce the issue when you can.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalHelp;
