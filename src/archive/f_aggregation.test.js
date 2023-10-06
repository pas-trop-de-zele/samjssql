const { Table, Aggregation } = require('../f_table');
const _ = require("lodash");


describe('Aggregation Class Unit Tests', () => {
    describe('Constructor error checking', () => {
        it('should throw error if mismatch between group by cols and cols derived from group by keys', () => {
            rowsByColumnMap = {
                'John_|_25' : {occupation: ['Software Engineer', 'Data Scientist'], salary: [10000, 40000]},
                'John_|_30' : {occupation: ['Product Manager'], salary: [20000]},
                'Bob_|_30' : {occupation: ['Software Engineer'], salary: [30000]},
            }
            expect(() => {
                const A = new Aggregation(['name'], ['string'], ['salary'],rowsByColumnMap);
            }).toThrow('Number of group by cols and number of cols derived from group by key splitting do not match');
            expect(() => {
                const A = new Aggregation(['name', 'age'],['string', 'number'], ['occupation'], rowsByColumnMap);
            }).toThrow('Number of remaining cols and number of cols derived from group rows do not match');
        });
        it('should throw error if mismatch between remaining cols and cols from group rows', () => {
            rowsByColumnMap = {
                'John_|_25' : {occupation: ['Software Engineer', 'Data Scientist'], salary: [10000, 40000]},
                'John_|_30' : {occupation: ['Product Manager'], salary: [20000]},
                'Bob_|_30' : {occupation: ['Software Engineer'], salary: [30000]},
            }
            expect(() => {
                const A = new Aggregation(['name', 'age'],  ['string', 'number'], ['occupation'],rowsByColumnMap);
            }).toThrow('Number of remaining cols and number of cols derived from group rows do not match');
        });
    });

    describe('_revertTypeFromString', () => {
        it('should return val with correct type', () => {
            expect(Aggregation._revertTypeFromString('0', 'number')).toEqual(0);
            expect(Aggregation._revertTypeFromString('0', 'string')).toEqual('0');
            expect(Aggregation._revertTypeFromString('true', 'string')).toEqual('true');
            expect(Aggregation._revertTypeFromString('true', 'boolean')).toEqual(true);
        });
        it('should return null if val is #####', () => {
            expect(Aggregation._revertTypeFromString('#####', 'string')).toEqual(null);
            expect(Aggregation._revertTypeFromString('#####', 'number')).toEqual(null);
            expect(Aggregation._revertTypeFromString('#####', 'boolean')).toEqual(null);
        });
    });

    describe('group by col with null values should decode correctly', () => {
        it('should translate ##### to null accurately', () => {
            groupByCols = ['name', 'age']
            groupbyColsTypes = ['string', 'number']
            remainingCols = ['salary']
            rowsByColumnMap = {
                'John_|_25' : {salary: [100, 200, 300]},
                'John_|_#####' : {salary: [400, 500, 600]},
                'Bob_|_#####' : {salary: [700]},
            }
            const A = new Aggregation(groupByCols, groupbyColsTypes, remainingCols, rowsByColumnMap);
            expect(A.sum('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, null, null],
                'sum(salary)': [600, 1500, 700],
            }));
        });
    });

    describe('sum() checking', () => {
        it('should return correct sum value', () => {
            groupByCols = ['name', 'age']
            groupbyColsTypes = ['string', 'number']
            remainingCols = ['salary']
            rowsByColumnMap = {
                'John_|_25' : {salary: [100, 200, 300]},
                'John_|_30' : {salary: [400, 500, 600]},
                'Bob_|_30' : {salary: [700]},
            }
            const A = new Aggregation(groupByCols, groupbyColsTypes, remainingCols, rowsByColumnMap);
            expect(A.sum('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'sum(salary)': [600, 1500, 700],
            }));
        });
        it('should ignore null and only get sum from the remainings', () => {
            groupByCols = ['name', 'age']
            remainingCols = ['salary']
            groupbyColsTypes = ['string', 'number']
            rowsByColumnMap = {
                'John_|_25' : {salary: [null, 200, 300]},
                'John_|_30' : {salary: [null, 500, 600]},
                'Bob_|_30' : {salary: [700]},
            }
            const A = new Aggregation(groupByCols, groupbyColsTypes, remainingCols, rowsByColumnMap);
            expect(A.sum('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'sum(salary)': [500, 1100, 700],
            }));
        });
        it('should throw error if all rows are null', () => {
            groupByCols = ['name', 'age']
            remainingCols = ['salary']
            groupbyColsTypes = ['string', 'number']
            rowsByColumnMap = {
                'John_|_25' : {salary: [100, 200, 300]},
                'John_|_30' : {salary: [400, 500, 600]},
                'Bob_|_30' : {salary: [null]},
            }
            const A = new Aggregation(groupByCols, groupbyColsTypes, remainingCols, rowsByColumnMap);
            expect(() => {
                A.sum('salary');
            }).toThrow("Cannot perform sum on all null values");
        });
    });

    describe('avg() checking', () => {
        it('should return correct average value', () => {
            groupByCols = ['name', 'age']
            groupbyColsTypes = ['string', 'number']
            remainingCols = ['salary']
            rowsByColumnMap = {
                'John_|_25' : {salary: [100, 200, 300]},
                'John_|_30' : {salary: [400, 500, 600]},
                'Bob_|_30' : {salary: [700]},
            }
            const A = new Aggregation(groupByCols, groupbyColsTypes, remainingCols, rowsByColumnMap);
            expect(A.avg('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'avg(salary)': [_.mean([100, 200, 300]), _.mean([400, 500, 600]), 700],
            }));
        });
        it('should ignore null and only get average from the remainings', () => {
            groupByCols = ['name', 'age']
            remainingCols = ['salary']
            groupbyColsTypes = ['string', 'number']
            rowsByColumnMap = {
                'John_|_25' : {salary: [null, 200, 300]},
                'John_|_30' : {salary: [null, 500, 600]},
                'Bob_|_30' : {salary: [700]},
            }
            const A = new Aggregation(groupByCols, groupbyColsTypes, remainingCols, rowsByColumnMap);
            expect(A.avg('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'avg(salary)': [_.mean([200, 300]), _.mean([500, 600]), 700],
            }));
        });
        it('should throw error if all rows are null', () => {
            groupByCols = ['name', 'age']
            remainingCols = ['salary']
            groupbyColsTypes = ['string', 'number']
            rowsByColumnMap = {
                'John_|_25' : {salary: [100, 200, 300]},
                'John_|_30' : {salary: [400, 500, 600]},
                'Bob_|_30' : {salary: [null]},
            }
            const A = new Aggregation(groupByCols, groupbyColsTypes, remainingCols, rowsByColumnMap);
            expect(() => {
                A.avg('salary');
            }).toThrow("Cannot perform average on all null values");
        });
    });

    describe('min() checking', () => {
        it('should return correct min value', () => {
            groupByCols = ['name', 'age']
            groupbyColsTypes = ['string', 'number']
            remainingCols = ['salary']
            rowsByColumnMap = {
                'John_|_25' : {salary: [100, 200, 300]},
                'John_|_30' : {salary: [400, 500, 600]},
                'Bob_|_30' : {salary: [700]},
            }
            const A = new Aggregation(groupByCols, groupbyColsTypes, remainingCols, rowsByColumnMap);
            expect(A.min('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'min(salary)': [100, 400, 700],
            }));
        });
        it('should ignore null and only get min from the remainings', () => {
            groupByCols = ['name', 'age']
            remainingCols = ['salary']
            groupbyColsTypes = ['string', 'number']
            rowsByColumnMap = {
                'John_|_25' : {salary: [null, 200, 300]},
                'John_|_30' : {salary: [null, 500, 600]},
                'Bob_|_30' : {salary: [700]},
            }
            const A = new Aggregation(groupByCols, groupbyColsTypes, remainingCols, rowsByColumnMap);
            expect(A.min('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'min(salary)': [200, 500, 700],
            }));
        });
        it('should returns null if all rows are null', () => {
            groupByCols = ['name', 'age']
            remainingCols = ['salary']
            groupbyColsTypes = ['string', 'number']
            rowsByColumnMap = {
                'John_|_25' : {salary: [100, 200, 300]},
                'John_|_30' : {salary: [400, 500, 600]},
                'Bob_|_30' : {salary: [null]},
            }
            const A = new Aggregation(groupByCols, groupbyColsTypes, remainingCols, rowsByColumnMap);
            expect(A.min('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'min(salary)': [100, 400, null],
            }));
        });
    });

    describe('max() checking', () => {
        it('should return correct max value', () => {
            groupByCols = ['name', 'age']
            groupbyColsTypes = ['string', 'number']
            remainingCols = ['salary']
            rowsByColumnMap = {
                'John_|_25' : {salary: [100, 200, 300]},
                'John_|_30' : {salary: [400, 500, 600]},
                'Bob_|_30' : {salary: [700]},
            }
            const A = new Aggregation(groupByCols, groupbyColsTypes, remainingCols, rowsByColumnMap);
            expect(A.max('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'max(salary)': [300, 600, 700],
            }));
        });
        it('should ignore null and only get max from the remainings', () => {
            groupByCols = ['name', 'age']
            remainingCols = ['salary']
            groupbyColsTypes = ['string', 'number']
            rowsByColumnMap = {
                'John_|_25' : {salary: [100, 200, null]},
                'John_|_30' : {salary: [400, 500, null]},
                'Bob_|_30' : {salary: [700]},
            }
            const A = new Aggregation(groupByCols, groupbyColsTypes, remainingCols, rowsByColumnMap);
            expect(A.max('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'max(salary)': [200, 500, 700],
            }));
        });
        it('should returns null if all rows are null', () => {
            groupByCols = ['name', 'age']
            remainingCols = ['salary']
            groupbyColsTypes = ['string', 'number']
            rowsByColumnMap = {
                'John_|_25' : {salary: [100, 200, 300]},
                'John_|_30' : {salary: [400, 500, 600]},
                'Bob_|_30' : {salary: [null]},
            }
            const A = new Aggregation(groupByCols, groupbyColsTypes, remainingCols, rowsByColumnMap);
            expect(A.max('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'max(salary)': [300, 600, null],
            }));
        });
    });
    
    describe('count() checking', () => {
        it('should return correct count value', () => {
            groupByCols = ['name', 'age']
            groupbyColsTypes = ['string', 'number']
            remainingCols = ['salary']
            rowsByColumnMap = {
                'John_|_25' : {salary: [100, 200, 300]},
                'John_|_30' : {salary: [400, 500, 600]},
                'Bob_|_30' : {salary: [700]},
            }
            const A = new Aggregation(groupByCols, groupbyColsTypes, remainingCols, rowsByColumnMap);
            expect(A.count('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'count(salary)': [3, 3, 1],
            }));
        });
        it('should ignore null and only get count from the remainings', () => {
            groupByCols = ['name', 'age']
            remainingCols = ['salary']
            groupbyColsTypes = ['string', 'number']
            rowsByColumnMap = {
                'John_|_25' : {salary: [100, 200, null]},
                'John_|_30' : {salary: [400, 500, null]},
                'Bob_|_30' : {salary: [700]},
            }
            const A = new Aggregation(groupByCols, groupbyColsTypes, remainingCols, rowsByColumnMap);
            expect(A.count('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'count(salary)': [2, 2, 1],
            }));
        });
        it('should returns null if all rows are null', () => {
            groupByCols = ['name', 'age']
            remainingCols = ['salary']
            groupbyColsTypes = ['string', 'number']
            rowsByColumnMap = {
                'John_|_25' : {salary: [100, 200, 300]},
                'John_|_30' : {salary: [400, 500, 600]},
                'Bob_|_30' : {salary: [null]},
            }
            const A = new Aggregation(groupByCols, groupbyColsTypes, remainingCols, rowsByColumnMap);
            expect(A.count('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'count(salary)': [3, 3, 0],
            }));
        });
    });

    describe('array_agg() checking', () => {
        it('should return correct array', () => {
            groupByCols = ['name', 'age']
            groupbyColsTypes = ['string', 'number']
            remainingCols = ['salary']
            rowsByColumnMap = {
                'John_|_25' : {salary: [100, 200, 300]},
                'John_|_30' : {salary: [400, 500, 600]},
                'Bob_|_30' : {salary: [700]},
            }
            const A = new Aggregation(groupByCols, groupbyColsTypes, remainingCols, rowsByColumnMap);
            expect(A.array_agg('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'array_agg(salary)': [[100, 200, 300], [400, 500, 600], [700]],
            }));
        });
        it('should keep null', () => {
            groupByCols = ['name', 'age']
            remainingCols = ['salary']
            groupbyColsTypes = ['string', 'number']
            rowsByColumnMap = {
                'John_|_25' : {salary: [100, 200, null]},
                'John_|_30' : {salary: [400, 500, null]},
                'Bob_|_30' : {salary: [null]},
            }
            const A = new Aggregation(groupByCols, groupbyColsTypes, remainingCols, rowsByColumnMap);
            expect(A.array_agg('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'array_agg(salary)': [[100, 200, null],[400, 500, null], [null]],
            }));
        });
    });
});