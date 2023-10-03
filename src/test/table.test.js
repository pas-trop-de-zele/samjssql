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

describe('Table Class Unit Tests', () => {
    describe('constructor', () => {
        it('should create a table instance with object A', () => {
            const table = new Table(A);
            expect(table.columns).toEqual(['name', 'age', 'occupation']);
            expect(table.colCount).toEqual(3);
            expect(table.rowCount).toEqual(4);
            expect(table.data).toEqual(A);
        });

        it('should create a table instance with object B', () => {
            const table = new Table(B);
            expect(table.columns).toEqual(['age', 'salary']);
            expect(table.colCount).toEqual(2);
            expect(table.rowCount).toEqual(4);
            expect(table.data).toEqual(B);
        });

        it('should create a table instance with object C', () => {
            const table = new Table(C);
            expect(table.columns).toEqual([]);
            expect(table.colCount).toEqual(0);
            expect(table.rowCount).toEqual(0);
            expect(table.data).toEqual(C);
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
            expect(unionAB).toEqual({
                name: ['John', 'Jane', 'Bob', 'Alice', 'John', 'Jane'],
                age: [25, 30, 40, 35, 25, 30],
                occupation: ['Software Engineer', 'Product Manager', 'Marketing Manager', 'Data Scientist', 'Software Engineer', 'Product Manager'],
            });
        });
        it('should throw error when there is a schema mismatch', () => {
            const tableA = new Table(A);
            const tableB = new Table(B);
            const tableC = new Table(C);
            // expect(tableA.union(tableB)).toThrowError();
            expect(() => tableA.union(tableB)).toThrow('Schema mismatched');
            expect(() => tableB.union(tableC)).toThrow('Schema mismatched');
            expect(() => tableA.union(tableC)).toThrow('Schema mismatched');
        })
    });
});