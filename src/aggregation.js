const _ = require("lodash");
const { Table } = require("./table");

class Aggregation {
    constructor(groupByCols, groupbyColsTypes, remainingCols, rowsByColumnMap) {
        /**
         * rowsByColumnMap format:
         * col1_|_col2_|_col3: {col4: [] , col4: [], col6: []}
         * col1, col2, col3 is in groupByCols same order
         * col3, col4, col4 is in remainingCols same order
         */

        for (let [groupbyVals, rows] of Object.entries(rowsByColumnMap)) {
            if (groupByCols.length !== groupbyVals.split("_|_").length) {
                throw new Error("Number of group by cols and number of cols derived from group by key splitting do not match")
            }
            if (remainingCols.length !== Object.keys(rows).length) {
                throw new Error("Number of remaining cols and number of cols derived from group rows do not match")
            }
        }

        this.groupByCols = groupByCols;
        this.groupbyColsTypes = groupbyColsTypes;
        this.remainingCols = remainingCols;
        this.rowsByColumnMap = rowsByColumnMap;
    }

    sum(...cols) {
        return this._rebuildTable((rows => {
            if (rows.every(row => row === null)) {
                throw new Error("Cannot perform sum on all null values")
            }
            return _.sum(rows); 
        }), 'sum', cols);
    }

    avg(...cols) {
        return this._rebuildTable((rows => {
            if (rows.every(row => row === null)) {
                throw new Error("Cannot perform average on all null values")
            }
            return _.mean(rows.filter(row => row !== null)); 
        }), 'avg', cols);
    }

    min(...cols) {
        return this._rebuildTable(_.min, 'min', cols);
    }

    max(...cols) {
        return this._rebuildTable(_.max, 'max', cols);
    }

    count(...cols) {
        return this._rebuildTable((rows => rows.filter(row => row != null).length), 'count', cols);
    }

    array_agg(...cols) {
        return this._rebuildTable((rows => rows), 'array_agg', cols);
    }

    customAggr(cols, customAggr, customAggrName) {
        return this._rebuildTable(customAggr, customAggrName, cols);
    }

    _rebuildTable(aggrFunc, arrgFuncName, aggrCols) {
        let ret = this.groupByCols.reduce((ret, col) => {
            ret[col] = [];
            return ret;
        }, {});

        let aggrColsNewName = aggrCols.map(col => `${arrgFuncName}(${col})`);
        aggrColsNewName.reduce((ret, col) => {
            ret[col] = [];
            return ret;
        }, ret);

        for (let [combinedColVal, rows] of Object.entries(this.rowsByColumnMap)) {
            const groupbyVals = combinedColVal.split("_|_");
            for (let i = 0; i < groupbyVals.length; ++i) {
                ret[this.groupByCols[i]].push(Aggregation._revertTypeFromString(groupbyVals[i], this.groupbyColsTypes[i]));
            }
            for (let i = 0; i < aggrCols.length; ++i) {
                ret[aggrColsNewName[i]].push(aggrFunc(rows[aggrCols[i]]) ?? null);
            }
        }
        return new Table(ret);
    }
    
    static _revertTypeFromString(val, type) {
        if (type === 'number') return Number(val);
        if (type === 'boolean') return Boolean(val);
        if (type === 'string') return String(val);
        throw Error("Unknown Type");
    }
}

module.exports = {Aggregation};