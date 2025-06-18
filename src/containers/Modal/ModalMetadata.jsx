import React, { useEffect, useState, useMemo } from "react";

import { useSelector, useDispatch } from "react-redux";

import ModalHeader from "./ModalHeader";
import MetadataAgGrid from "../../components/AgGrid/MetadataAgGrid";

function ModalMetadata(props) {
    const {file, row_idx} = props;
    const tiff_tags = useSelector(state => state.viewer.tiff_tags);
    const ifds = useSelector(state => state.files.ifds);
    let [table, set_table] = useState(null);

    useEffect(() => {
        if (ifds[file] && !table) {
            set_table(ifds[file]);
        }
    }, [ifds, file]);

    return (
        <div className="__modal">
        <ModalHeader title={"Metadata"} type={"metadata"}/>
        <div className="__content">
            <div className="__metadata_viewer">
                {
                    table && Object.keys(table).length > 0 && (
                        <MetadataAgGrid 
                        autoSizeStrategy={{type: 'fitCellContents'}} 
                        suppressMovableColumns={true}
                        ensureDomOrder={true}
                        suppressDragLeaveHidesColumns={true}
                        enableCellTextSelection = {true}
                        undoRedoCellEditing = {true}
                        undoRedoCellEditingLimit = {20}
                        table={table}/>
                    )
                }
            </div>
        </div>
        </div>
    );
}

export default ModalMetadata;