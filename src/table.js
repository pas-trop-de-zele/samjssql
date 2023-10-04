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
        cols = cols.length > 0 ? cols : this.columns;
        return new Table(cols.reduce((ret, col) => {
            if (!this.data.hasOwnProperty(col)) {
                throw new Error("Column does not exist");
            }
            ret[col] = this._deepclone(this.data[col]);
            return ret;
        }, {}));
    }

    filter(filterFunction) {
        let keepIndices = Array.from({ length: this.rowCount }, (_, i) => i).filter(filterFunction ?? (i => i==i));
        return new Table(keepIndices.reduce((ret, i) => {
            for (let col of this.columns) {
                ret[col].push(this.data[col][i]);
            }
            return ret;
        }, this._getBlankTable()))
    }

    union(B) {
        if (!this._equalSchema(B)) {
            throw new Error("Schema mismatched");
        }
        return new Table(this.columns.reduce((ret, col) => {
            ret[col].push(...this.data[col]);
            ret[col].push(...B.data[col]);
            return ret;
        }, this._getBlankTable())); 
    }

    _groupRowsByCols(groupByCols, aggrCols) {
        if (groupByCols.length === 0) {
            throw new Error("Need at least 1 column for grouping");
        }
        let group = {};
        for (let row = 0; row < this.rowCount; ++row) {
            const colValsCombined = groupByCols.map(col => this.data[col][row]).join('_|_');
            if (!group.hasOwnProperty(colValsCombined)) group[colValsCombined] = aggrCols.reduce((ret, col) => {
                ret[col] = [];
                return ret;
            }, {});
            aggrCols.forEach(col => {
                group[colValsCombined][col].push(this.data[col][row]);
            });
        }
        return group;
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

    _deepclone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
}

