import { parse as parseCSV } from 'csv-parse/sync';
import { stringify as stringifyCSV } from 'csv-stringify/sync';
import { parse as parseXLSX } from 'node-xlsx';
import fs from 'fs';
import path from 'path';

/**
 * Write data to a CSV file
 * @param file A file path to write to.
 * @param data An array of data to write to the CSV file.  Should have a header, an array, and rows, an array of objects
 * with corresponding names from row.
 * @returns {boolean}
 */

export function writeCSV(file, data){
    try{
      // Build the data rows
      let csv_rows = [];
      csv_rows.push(data.header);
      for (let row of data.rows) {
        let row_array = new Array(data.header.length);
        for (let column of data.header) {
          let column_index = data.header.indexOf(column);
          row_array[column_index] = row[column];
        }
        csv_rows.push(row_array);
      }

      // Write the data rows
      const csv_text_output = stringifyCSV(csv_rows);
      fs.writeFileSync(file, csv_text_output);
    }
    catch(e){
      console.log("CSV Writing error:", e);
      return false;
    }
}

/**
 * Get headers (first row) and data (remaining rows) from a CSV file
 * @param {String} file 
 * @returns {Object} object with fields 'headers' and 'data'
 */
export function readCSV(file){
    try{
        const csvText = fs.readFileSync(file, "utf-8");
        const parsed = parseCSV(csvText);
        return {
            headers: parsed[0],
            data: parsed.slice(1)
        };
        
    } catch (e) {
        console.log("CSV Parsing error:", e);
        return null;
    }
}

/**
 * Get headers (first row) and data (remaining row) from the first sheet of an XLSX file
 * @param {String} file 
 * @returns {Object} object with fields 'headers' and 'data'
 */
export function readExcel(file){
    try{
        const parsed = parseXLSX(file);
        const sheet1 = parsed[0];
        const data = sheet1.data;
        return {
            headers: data[0],
            data: data.slice(1)
        };
        
    } catch (e) {
        console.log("Excel Parsing error:", e);
        return null;
    }
}

export function parseSpreadsheet(source){
    const filepath = source.path;
    const ext = source.parsed.ext;
    
    let contents;
    // handle different file types
    if(ext.toLowerCase() === '.csv'){
        // handle CSV file
        contents  = readCSV(filepath);
    } else if (ext.toLowerCase() === '.xlsx'){
        // handle XLXS file
        contents = readExcel(filepath);
    } else {
        throw new Error(`Bad file extension (${ext}): only .csv and .xlsx are supported`);
    }

    // readCSV and readExcel both return objects with headers and data
    const headers = contents.headers;
    const data = contents.data;

    // find the index of the source and (optional) destination columns within the header list
    const sourceIndex = headers?.map(v=>v.toLowerCase().trim()).indexOf('source');
    const destinationIndex = headers?.map(v=>v.toLowerCase().trim()).indexOf('destination');

    // if 'source' column was found, we can process the sheet
    if(sourceIndex > -1){

        // normalize the source and destination headers to lower case
        headers[sourceIndex] = 'source'; //normalize to lower case
        if(destinationIndex > -1) {
            headers[destinationIndex] = 'destination'; //normalize to lower case
        }

        // map each row of data into an object with keys taken from the header row
        return data.map(values=>{
            return values.reduce((acc, value, index)=>{
                if(acc[headers[index]]){
                    throw new Error('Duplicate column deteceted: '+headers[index]);
                }
                if(index === sourceIndex || index === destinationIndex){
                    acc[headers[index]]={
                        parsed: path.parse(value),
                        filename: path.basename(value),
                        directory: path.dirname(value),
                        path: value,
                        sep: path.sep
                    } 
                } else {
                    acc[headers[index]] = value;
                }
                return acc;
            }, {});
        });
    } else {
        console.log(headers,headers?.map(v=>v.toLowerCase().trim()), headers?.map(v=>v.toLowerCase().trim()).indexOf('source'));
        throw new Error('The first row of the spreadsheet must contain headers which must include \'source\'');
    }
    
}