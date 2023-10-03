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

    equals(B) {
        return _.isEqual(this.data, B.data);
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

module.exports = {Table};

const A = {
    name: ['John', 'Jane', 'Bob', 'Alice'],
    age: [25, 30, 40, 35],
    occupation: ['Software Engineer', 'Product Manager', 'Marketing Manager', 'Data Scientist']
};
tableA = new Table(A);
tableA.filter(i => {
    return tableA.data['name'][i] === 'John';
});