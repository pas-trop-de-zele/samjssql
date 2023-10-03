let _ = require("lodash")

class Table {
    constructor(A) {
        this.data = A;
        this.columns = Object.keys(A);
        this.colCount = Object.keys(A).length;
        this.rowCount = this.colCount > 0 ? A[this.columns[0]].length : 0;
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

    select(...cols) {
        
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

}

module.exports = {Table};