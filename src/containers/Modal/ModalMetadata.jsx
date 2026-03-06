import React, { useEffect, useState, useMemo } from "react";

import { useSelector, useDispatch } from "react-redux";

import ModalHeader from "./ModalHeader";
import MetadataAgGrid from "../../components/AgGrid/MetadataAgGrid";

function ModalMetadata(props) {
    const {file, row_idx} = props;
    const tiff_tags = useSelector(state => state.viewer.tiff_tags);
    const ifds = useSelector(state => state.files.ifds);
    const display_changed_only = useSelector(state => state.modal.display_changed_only);
    const files = useSelector(state => state.files);
    let [table, set_table] = useState(null);

    useEffect(() => {
        if (ifds[file] && !table) {
            set_table(ifds[file]);
        }
    }, [ifds, file]);

    let file_row = files.file_rows[row_idx];

    return (
        <div className="__modal">
        <ModalHeader title={"Metadata"} type={"metadata"} display_changed_only={display_changed_only}/>
        <div className="__content">
            <div className="__metadata_viewer">
                {
                    (file_row.__reserved.processed !== 1 && table && Object.keys(table).length > 0) ? (
                        <MetadataAgGrid 
                        display_changed_only={display_changed_only}
                        autoSizeStrategy={{type: 'fitCellContents'}} 
                        suppressMovableColumns={true}
                        ensureDomOrder={true}
                        suppressDragLeaveHidesColumns={true}
                        enableCellTextSelection = {true}
                        undoRedoCellEditing = {true}
                        undoRedoCellEditingLimit = {20}
                        table={table}/>
                    ) : 
                    <div className="__metadata-table-not-available">
                        <p>Metadata not available for processed files.</p>
                    </div>
                }
            </div>
        </div>
        </div>
    );
}

export default ModalMetadata;