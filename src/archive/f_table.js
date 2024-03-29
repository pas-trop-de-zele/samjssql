const _ = require("lodash");

const constants = {
    NULLENCODE: '#####',
    COLUMNSEP: '_|_',
};

const joinType = {
    INNER: 'inner',
    LEFT: 'left',
};

function Table(A) {
    this.data = A;
}

Object.defineProperty(Table.prototype, 'colCount', {
    get: function() {
        return this.columns.length;
    }
});

Object.defineProperty(Table.prototype, 'rowCount', {
    get: function() {
        return this.colCount > 0 ? this.data[this.columns[0]].length : 0;
    }
});

Object.defineProperty(Table.prototype, 'columns', {
    get: function() {
        return Object.keys(this.data);
    }
});

Table.prototype.select = function(...cols) {
    cols = cols.length > 0 ? cols : this.columns;
    return new Table(cols.reduce((ret, col) => {
        if (!this._hasCol(col)) {
            throw new Error("Column does not exist");
        }
        ret[col] = this._deepclone(this.data[col]);
        return ret;
    }, {}));
};

Table.prototype.filter = function(filterFunction) {
    let keepIndices = Array.from({ length: this.rowCount }, (_, i) => i).filter(filterFunction ?? (i => i==i));
        return new Table(keepIndices.reduce((ret, i) => {
            for (let col of this.columns) {
                ret[col].push(this.data[col][i]);
            }
            return ret;
        }, this._getBlankTable()))
};

Table.prototype.groupby = function(...groupByCols) {
    const remainingCols = this._getRemainingCols(groupByCols);
    const groupbyColsTypes = groupByCols.map(col => this._getColType(col));
    return new Aggregation(groupByCols, groupbyColsTypes, remainingCols, this._groupRowsByCols(groupByCols, remainingCols));
};

Table.prototype.asc = function(col) {
    return this._sort(col, true);
};

Table.prototype.desc = function(col) {
    return this._sort(col, false);
};

Table.prototype.union = function(B) {
    if (!this._equalSchema(B)) {
        throw new Error("Schema mismatched");
    }
    return new Table(this.columns.reduce((ret, col) => {
        ret[col].push(...this.data[col]);
        ret[col].push(...B.data[col]);
        return ret;
    }, this._getBlankTable()));
};

Table.prototype.leftJoin = function(B, joinCol) {
    return this._join(B, joinCol, joinType.LEFT);
};

Table.prototype.innerJoin = function(B, joinCol) {
    return this._join(B, joinCol, joinType.INNER);
};

Table.prototype.limit = function(rowLim) {
    if (rowLim < 0) {
        throw new Error("Row count cannot be lower than 0");
    }
    let ret = this._getBlankTable();
    for (let i = 0; i < Math.min(rowLim, this.rowCount); ++i) {
        this.columns.forEach(col => {
            ret[col].push(this.data[col][i]);
        })
    }
    return new Table(ret);
};

Table.prototype._join = function(B, joinCol, joinCategory) {
    if (!this._hasCol(joinCol) || !B._hasCol(joinCol)) {
        throw new Error(`Col ${joinCol} does not exist on either or both side`)
    }

    let Bmap = B._groupRowsByCols([joinCol], B._getRemainingCols(joinCol));
    let translatedCol = {}
    let ret = this._getBlankTable();
    for (let col of B.columns) {
        const distinctName = this._hasCol(col) ?  `_${col}` : col;
        translatedCol[col] = distinctName;
        if (col === joinCol) continue // skip joinning column from B
        ret[distinctName] = []
    }
    for (let rowA = 0; rowA < this.rowCount; ++rowA) {
        let joinVal = this.data[joinCol][rowA];
        const Bside = Bmap[joinVal];
        if (Bside === undefined) {
            if (joinCategory === joinType.INNER) continue;
            for (let col of this.columns) ret[col].push(this.data[col][rowA]);
            for (let col of B.columns.filter(col => col !== joinCol)) {
                ret[translatedCol[col]].push(null);
            }
        } else {
            let BsideRowCount = Bside[Object.keys(Bside)[0]].length;
            for (let rowB = 0; rowB < BsideRowCount; ++rowB) {
                for (let col of this.columns) ret[col].push(this.data[col][rowA]);
                for (let col of B.columns.filter(col => col !== joinCol)) {
                    if (col === joinCol) continue;
                    ret[translatedCol[col]].push(Bside[col][rowB]);
                } 
            }
        }
    }
    return new Table(ret);
};

Table.prototype._sort = function(sortCol, ascending) {
    const newOrder = this._getNewOrder(sortCol, ascending);
    return new Table(newOrder.reduce((ret, row) => {
        this.columns.forEach(col => {
            ret[col].push(this.data[col][row]);
        })
        return ret;
    }, this._getBlankTable()));
};

Table.prototype._getNewOrder = function(col, ascending) {
    let toCompare = [];
    for (let row = 0; row < this.rowCount; ++row) {
        toCompare.push([this.data[col][row], row]);
    }
    toCompare.sort(this._comparator(ascending));
    const newOrder = toCompare.map(x => x[1]);
    return newOrder;
};

Table.prototype._comparator = function(ascending) {
    // treat null as the largest value
    return (a, b) => {
        if (a[0] === b[0]) {
            return 0;
        }

        if (ascending) {
            if (a[0] === null) return 1
            if (b[0] == null) return -1
            return a[0] < b[0] ? -1 : 1;
        }

        if (a[0] === null) return -1
        if (b[0] == null) return 1
        return a[0] < b[0] ? 1 : -1;
    };
};

Table.prototype._groupRowsByCols = function(groupByCols, remainingCols) {
    if (groupByCols.length === 0) {
        throw new Error("Need at least 1 group by column");
    }
    
    if (remainingCols.length === 0) {
        throw new Error("Need at least 1 aggregate column");
    }
    
    let group = {};
    for (let row = 0; row < this.rowCount; ++row) {
        const groupbyKey = this._getGroupbyKey(groupByCols, row);
        if (!group.hasOwnProperty(groupbyKey)) group[groupbyKey] = remainingCols.reduce((ret, col) => {
            ret[col] = [];
            return ret;
        }, {});
        remainingCols.forEach(col => {
            group[groupbyKey][col].push(this.data[col][row]);
        });
    }
    return group;
};

Table.prototype._getBlankTable = function() {
    return this.columns.reduce((ret, col) => {
        ret[col] = [];
        return ret;
    }, {});
};

Table.prototype._equalSchema = function(B) {
    return _.isEqual(this._getBlankTable(), B._getBlankTable());
};

Table.prototype._deepclone = function(obj) {
    return JSON.parse(JSON.stringify(obj));
};

Table.prototype._getColType = function(col) {
    for (let row of this.data[col]) {
        if (row !== null) return typeof row;
    }
    return 'string';
};

Table.prototype._getGroupbyKey = function(groupByCols, row) {
    return groupByCols.map(col => this.data[col][row] ?? constants.NULLENCODE).join(constants.COLUMNSEP)
};

Table.prototype._hasCol = function(col) {
    return this.data.hasOwnProperty(col);
};

Table.prototype._getRemainingCols = function(selectedCols) {
    const selectedColsSet = new Set(selectedCols)
    return this.columns.filter(x => !selectedColsSet.has(x));
};

function Aggregation(groupByCols, groupbyColsTypes, remainingCols, rowsByColumnMap) {
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

Aggregation.prototype.sum = function(...cols) {
    return this._rebuildTable((rows => {
        if (rows.every(row => row === null)) {
            throw new Error("Cannot perform sum on all null values")
        }
        return _.sum(rows); 
    }), 'sum', cols);
};

Aggregation.prototype.avg = function(...cols) {
    return this._rebuildTable((rows => {
        if (rows.every(row => row === null)) {
            throw new Error("Cannot perform average on all null values")
        }
        return _.mean(rows.filter(row => row !== null)); 
    }), 'avg', cols);
};

Aggregation.prototype.min = function(...cols) {
    return this._rebuildTable(_.min, 'min', cols);
};

Aggregation.prototype.max = function(...cols) {
    return this._rebuildTable(_.max, 'max', cols);
};

Aggregation.prototype.count = function(...cols) {
    return this._rebuildTable((rows => rows.filter(row => row != null).length), 'count', cols);
};

Aggregation.prototype.array_agg = function(...cols) {
    return this._rebuildTable((rows => rows), 'array_agg', cols);
};

Aggregation.prototype.customAggr = function(cols, customAggr, customAggrName) {
    return this._rebuildTable(customAggr, customAggrName, cols);
};

Aggregation.prototype._rebuildTable = function(aggrFunc, arrgFuncName, aggrCols) {
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
};

Aggregation._revertTypeFromString = function(val, type) {
        /**
         * null value are encoded as #####
         * Ex: col1_|_#####_|_col3
         * After parsing row should become
         * col1 | null | col3
         */
        if (val === constants.NULLENCODE) return null;
        if (type === 'number') return Number(val);
        if (type === 'boolean') return Boolean(val);
        if (type === 'string') return String(val);
        throw Error("Unknown Type");
};

module.exports = { Table, Aggregation, constants };
