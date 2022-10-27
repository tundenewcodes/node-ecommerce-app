const fs = require('fs');
const DatauriParser = require('datauri/parser')
const parser = new DatauriParser()
const bufferToDataURI = (fileFormat, buffer) => {
    parser.format(fileFormat, buffer)
}
const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            throw (err);
        }
    });
}

module.exports = { bufferToDataURI, deleteFile };