const Table = require('../table').Table;

const A = {
    name: ['John', 'Jane', 'Bob', 'Alice'],
    age: [25, 30, 40, 35],
    occupation: ['Software Engineer', 'Product Manager', 'Marketing Manager', 'Data Scientist']
};

const A1 = {
    name: ['John', 'Jane'],
    age: [25, 30],
    occupation: ['Software Engineer', 'Product Manager']
};

const B = {
    age: [25, 30, 60, 70],
    salary: [50000, 75000, 100000, 125000]
};

const C = {}

const D = {
    name: ['John', 'John', 'Bob', 'John'],
    age: [25, 30, 30, 25],
    occupation: ['Software Engineer', 'Product Manager', 'Software Engineer', 'Data Scientist'],
    salary: [10000, 20000, 30000, 40000]
}

describe('Table Class Unit Tests', () => {
    describe('constructor', () => {
        it('creates a table with correct column count', () => {
            const tableA = new Table(A);
            expect(tableA.colCount).toBe(3);

            const tableB = new Table(B);
            expect(tableB.colCount).toBe(2);

            const tableC = new Table(C);
            expect(tableC.colCount).toBe(0);
        });

        it('creates a table with correct column names', () => {
            const tableA = new Table(A);
            expect(tableA.columns).toEqual(['name', 'age', 'occupation']);

            const tableB = new Table(B);
            expect(tableB.columns).toEqual(['age', 'salary']);

            const tableC = new Table(C);
            expect(tableC.columns).toEqual([]);
        });

        it('creates a table with correct row count', () => {
            const tableA = new Table(A);
            expect(tableA.rowCount).toBe(4);

            const tableB = new Table(B);
            expect(tableB.rowCount).toBe(4);

            const tableC = new Table(C);
            expect(tableC.rowCount).toBe(0);
        });
    });

    describe('_getBlankTable', () => {
        it('should return a blank table with the same schema as the current table', () => {
            const tableA = new Table(A);
            const blankTable = tableA._getBlankTable();
            expect(blankTable).toEqual({ name: [], age: [], occupation: [] });
        });
    });

    describe('_equalSchema', () => {
        it('should return true for two tables with equal schema', () => {
            const tableA = new Table(A);
            const tableA1 = new Table(A1);
            const isEqual = tableA._equalSchema(tableA1);
            expect(isEqual).toEqual(true);
        });

        it('should return false for two tables with different schema', () => {
            const tableA = new Table(A);
            const tableB = new Table(B);
            const tableC = new Table(C);
            expect(tableA._equalSchema(tableB)).toEqual(false);
            expect(tableA._equalSchema(tableC)).toEqual(false);
            expect(tableB._equalSchema(tableC)).toEqual(false);
        });
    });

    describe('union', () => {
        it('should return a union table of two tables with the same schema', () => {
            const tableA = new Table(A);
            const tableA1 = new Table(A1);
            const unionAB = tableA.union(tableA1);
            expect(unionAB).toEqual(new Table({
                name: ['John', 'Jane', 'Bob', 'Alice', 'John', 'Jane'],
                age: [25, 30, 40, 35, 25, 30],
                occupation: ['Software Engineer', 'Product Manager', 'Marketing Manager', 'Data Scientist', 'Software Engineer', 'Product Manager'],
            }));
        });
        it('should throw error when there is a schema mismatch', () => {
            const tableA = new Table(A);
            const tableB = new Table(B);
            const tableC = new Table(C);
            expect(() => tableA.union(tableB)).toThrow('Schema mismatched');
            expect(() => tableB.union(tableC)).toThrow('Schema mismatched');
            expect(() => tableA.union(tableC)).toThrow('Schema mismatched');
        })
    });

    describe('_groupRowsByCols', () => {
        it('should group rows by group by cols', () => {
            const tableD = new Table(D);
            expect(tableD._groupRowsByCols(['name'],['age', 'occupation', 'salary'])).toEqual({
                'John': {age: [25, 30, 25], occupation: ['Software Engineer', 'Product Manager', 'Data Scientist'], salary: [10000, 20000, 40000]},
                'Bob': {age: [30], occupation: ['Software Engineer'], salary: [30000]},
            });
            expect(tableD._groupRowsByCols(['name', 'age'],['occupation', 'salary'])).toEqual({
                'John_|_25' : {occupation: ['Software Engineer', 'Data Scientist'], salary: [10000, 40000]},
                'John_|_30' : {occupation: ['Product Manager'], salary: [20000]},
                'Bob_|_30' : {occupation: ['Software Engineer'], salary: [30000]},
            });
            expect(tableD._groupRowsByCols(['name', 'age', 'occupation'],['salary'])).toEqual({
                'John_|_25_|_Software Engineer' : {salary: [10000]},
                'John_|_30_|_Product Manager' : {salary: [20000]},
                'Bob_|_30_|_Software Engineer' : {salary: [30000]},
                'John_|_25_|_Data Scientist' : {salary: [40000]}
            });
            expect(tableD._groupRowsByCols(['name', 'age', 'occupation'],['salary'])).toEqual({
                'John_|_25_|_Software Engineer' : {salary: [10000]},
                'John_|_30_|_Product Manager' : {salary: [20000]},
                'Bob_|_30_|_Software Engineer' : {salary: [30000]},
                'John_|_25_|_Data Scientist' : {salary: [40000]}
            });
        });
        it('should work fine when not all columns are selected', () => {
            const tableD = new Table(D);
            expect(tableD._groupRowsByCols(['name'],['salary'])).toEqual({
                'John': {salary: [10000, 20000, 40000]},
                'Bob': {salary: [30000]}
            });
        });
        it('should have no rows if all columns are selected', () => {
            const tableD = new Table(D);
            expect(tableD._groupRowsByCols(['name', 'age', 'occupation', 'salary'],[])).toEqual({
                'John_|_25_|_Software Engineer_|_10000' : {},
                'John_|_30_|_Product Manager_|_20000' : {},
                'Bob_|_30_|_Software Engineer_|_30000' : {},
                'John_|_25_|_Data Scientist_|_40000' : {}
            });
        });
        it('should throw an error if specify no group by columns', () => {
            const tableD = new Table(D);
            expect(() => {
                tableD._groupRowsByCols([],[]);
            }).toThrow('Need at least 1 column for grouping');
        });
    });

    describe('select', () => {
        it('should return a new table with only the selected columns', () => {
            const table = new Table(A);
            expect(table.select('name', 'age')).toEqual(new Table({
                name: ['John', 'Jane', 'Bob', 'Alice'],
                age: [25, 30, 40, 35]
            }));
            expect(table.select('name')).toEqual(new Table({
                name: ['John', 'Jane', 'Bob', 'Alice'],
            }));
            const emptyTable = new Table(C);
            expect(emptyTable.select()).toEqual(new Table({}));
        });
        it('should return every column if specify no column', () => {
            const table = new Table(A);
            expect(table.select()).toEqual(new Table({
                name: ['John', 'Jane', 'Bob', 'Alice'],
                age: [25, 30, 40, 35],
                occupation: ['Software Engineer', 'Product Manager', 'Marketing Manager', 'Data Scientist']
            }));
        });

        it('should throw an error if a selected column does not exist', () => {
            const table = new Table(A);
            expect(() => {
                table.select('name', 'salary');
            }).toThrow('Column does not exist');
            expect(() => {
                table.select('salary');
            }).toThrow('Column does not exist');
        });
    });

    describe('filter', () => {
        it('should return only rows that satisfies conditions', () => {
            const table = new Table(A);
            expect(table.filter(i => {
                return table.data['name'][i] === 'John';
            })).toEqual(new Table({
                name: ['John'],
                age: [25],
                occupation: ['Software Engineer']
            }));
            expect(table.filter(i => {
                return table.data['name'][i] === 'John' && table.data['age'][i] == 30;
            })).toEqual(new Table({
                name: [],
                age: [],
                occupation: []
            }));
            expect(table.filter(i => {
                return table.data['age'][i] > 25;
            })).toEqual(new Table( {
                name: ['Jane', 'Bob', 'Alice'],
                age: [30, 40, 35],
                occupation: ['Product Manager', 'Marketing Manager', 'Data Scientist']
            }));
            expect(table.filter(i => {
                return table.data['age'][i] == 35 || table.data['age'][i] == 30
            })).toEqual(new Table({
                name: ['Jane', 'Alice'],
                age: [30, 35],
                occupation: ['Product Manager', 'Data Scientist']
            }));
        });
        it('should return empty rows if no match', () => {
            const table = new Table(A);
            expect(table.filter(i => {
                return table.data['name'][i] === 'John' && table.data['age'][i] == 30;
            })).toEqual(new Table({
                name: [],
                age: [],
                occupation: []
            }));
        });
        it('should return full rows if specify no function', () => {
            const table = new Table(A);
            expect(table.filter()).toEqual(new Table({
                name: ['John', 'Jane', 'Bob', 'Alice'],
                age: [25, 30, 40, 35],
                occupation: ['Software Engineer', 'Product Manager', 'Marketing Manager', 'Data Scientist']
            }));
        });
    });
});