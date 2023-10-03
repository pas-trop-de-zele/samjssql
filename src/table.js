let _ = require("lodash")

class Table {
    constructor(A) {
        this.data = A;
    }

    get colCount() {
        return this.columns.length;
    }
    
    get rowCount() {
        return this.colCount > 0 ? this.data[this.columns[0]].length : 0;
    }

    get columns() {
        return Object.keys(this.data);
    }

    select(...cols) {
        // # add col?
        // # add row?
    }

    union(B) {
        if (!this._equalSchema(B)) {
            throw new Error("Schema mismatched");
        }
        let ret = this._getBlankTable();
        for (let col of this.columns) {
            ret[col].push(...this.data[col]);
            ret[col].push(...B.data[col]);
        } 
        return ret; 
    }

    _getBlankTable() {
        return this.columns.reduce((ret, col) => {
            ret[col] = [];
            return ret;
        }, {});
    }

    _equalSchema(B) {
        return _.isEqual(this._getBlankTable(), B._getBlankTable());
    }

}

module.exports = {Table};