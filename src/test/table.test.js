const { Table, Aggregation, constants } = require('../table');

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

const E = {
    name: ['John', 'John', 'Bob', 'John'],
    age: [25, null, null, 25],
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

    describe('_getGroupbyKey', () => {
        const tableE = new Table(E);
        it('should encode correctly', () => {
            expect(tableE._getGroupbyKey(['name', 'age'], 0)).toEqual("John_|_25")
        });
        it('should encode correctly with null', () => {
            expect(tableE._getGroupbyKey(['name', 'age'], 1)).toEqual("John_|_#####")
        });
    });

    describe('_groupRowsByCols', () => {
        it('should group rows by group by cols', () => {
            const tableD = new Table(D);
            expect(tableD._groupRowsByCols(['name'], ['age', 'occupation', 'salary'])).toEqual({
                'John': { age: [25, 30, 25], occupation: ['Software Engineer', 'Product Manager', 'Data Scientist'], salary: [10000, 20000, 40000] },
                'Bob': { age: [30], occupation: ['Software Engineer'], salary: [30000] },
            });
            expect(tableD._groupRowsByCols(['name', 'age'], ['occupation', 'salary'])).toEqual({
                'John_|_25': { occupation: ['Software Engineer', 'Data Scientist'], salary: [10000, 40000] },
                'John_|_30': { occupation: ['Product Manager'], salary: [20000] },
                'Bob_|_30': { occupation: ['Software Engineer'], salary: [30000] },
            });
            expect(tableD._groupRowsByCols(['name', 'age', 'occupation'], ['salary'])).toEqual({
                'John_|_25_|_Software Engineer': { salary: [10000] },
                'John_|_30_|_Product Manager': { salary: [20000] },
                'Bob_|_30_|_Software Engineer': { salary: [30000] },
                'John_|_25_|_Data Scientist': { salary: [40000] }
            });
            expect(tableD._groupRowsByCols(['name', 'age', 'occupation'], ['salary'])).toEqual({
                'John_|_25_|_Software Engineer': { salary: [10000] },
                'John_|_30_|_Product Manager': { salary: [20000] },
                'Bob_|_30_|_Software Engineer': { salary: [30000] },
                'John_|_25_|_Data Scientist': { salary: [40000] }
            });
        });
        it('should work fine when not all columns are selected', () => {
            const tableD = new Table(D);
            expect(tableD._groupRowsByCols(['name'], ['salary'])).toEqual({
                'John': { salary: [10000, 20000, 40000] },
                'Bob': { salary: [30000] }
            });
            expect(tableD._groupRowsByCols(['name', 'age'], ['salary'])).toEqual({
                'John_|_25': { salary: [10000, 40000] },
                'John_|_30': { salary: [20000] },
                'Bob_|_30': { salary: [30000] },
            });
        });
        it(`should encode null value as ${constants.NULLENCODE}`, () => {
            const tableE = new Table(E);
            expect(tableE._groupRowsByCols(['name', 'age'], ['salary'])).toEqual({
                'John_|_25': { salary: [10000, 40000] },
                'John_|_#####': { salary: [20000] },
                'Bob_|_#####': { salary: [30000] },
            });
        });
        it('should throw an error if specify no group by columns', () => {
            const tableD = new Table(D);
            expect(() => {
                tableD._groupRowsByCols([], []);
            }).toThrow('Need at least 1 group by column');
        });
        it('should throw and error if specify no aggregate column', () => {
            const tableD = new Table(D);
            expect(() => {
                tableD._groupRowsByCols(['name', 'age', 'occupation', 'salary'], []);
            }).toThrow('Need at least 1 aggregate column');
        });
    });

    describe('_getNewOrder', () => {
        const table = new Table({
            'name': ['c', null, 'a', 'h', null, 'f', 'g', null, 'h'],
            'age': [1, 9, 5, null, 20, 10, 6, 0, null],
            'good': [true, true, null, false, true, false, null, false, null]
        })
        it('should sort string value with null correctly', () => {
            expect(table._getNewOrder('name', true)).toEqual([2, 0, 5, 6, 3, 8, 1, 4, 7])
            expect(table._getNewOrder('name', false)).toEqual([1, 4, 7, 3, 8, 6, 5, 0, 2]);
        })
        it('should sort numeric value with null correctly', () => {
            expect(table._getNewOrder('age', true)).toEqual([7, 0, 2, 6, 1, 5, 4, 3, 8])
            expect(table._getNewOrder('age', false)).toEqual([3, 8, 4, 5, 1, 6, 2, 0, 7])
        })
        it('should sort boolean value with null correctly', () => {
            expect(table._getNewOrder('good', true)).toEqual([3, 5, 7, 0, 1, 4, 2, 6, 8])
            expect(table._getNewOrder('good', false)).toEqual([2, 6, 8, 0, 1, 4, 3, 5, 7])
        })

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
            })).toEqual(new Table({
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

    describe('asc', () => {
        const table = new Table({
            'name': ['c', null, 'a', 'h', null, 'f', 'g', null, 'h'],
            'age': [1, 9, 5, null, 20, 10, 6, 0, null],
            'good': [true, true, null, false, true, false, null, false, null]
        })

        it('should sort by string col correctly', () => {
            expect(table.asc('name')).toEqual(new Table({
                name: [
                    'a', 'c', 'f',
                    'g', 'h', 'h',
                    null, null, null
                ],
                age: [
                    5, 1, 10, 6,
                    null, null, 9, 20,
                    0
                ],
                good: [
                    null, true, false,
                    null, false, null,
                    true, true, false
                ]
            }));
        });
        it('should sort by numeric col correctly', () => {
            expect(table.asc('age')).toEqual(new Table({
                name: [
                    null, 'c', 'a',
                    'g', null, 'f',
                    null, 'h', 'h'
                ],
                age: [
                    0, 1, 5, 6,
                    9, 10, 20, null,
                    null
                ],
                good: [
                    false, true, null,
                    null, true, false,
                    true, false, null
                ]
            }));
        });
        it('should sort by boolean col correctly', () => {
            expect(table.asc('good')).toEqual(new Table({
                name: [
                    'h', 'f', null,
                    'c', null, null,
                    'a', 'g', 'h'
                ],
                age: [
                    null, 10, 0, 1,
                    9, 20, 5, 6,
                    null
                ],
                good: [
                    false, false, false,
                    true, true, true,
                    null, null, null
                ]
            }));
        });
        // it('should sort by multiple cols correctly', () => {
        //     expect(new Table({
        //         name: ['b', 'c', 'c', 'a'],
        //         salary: [1, 3, 2, 4]                    
        //     }).asc('name').desc('salary')).toEqual(new Table({
        //         name:  ['a','b', 'c', 'c'],
        //         salary: [4  ,1  , 3  , 2]                    
        //     }));
        // });
    })

    describe('desc', () => {
        const table = new Table({
            'name': ['c', null, 'a', 'h', null, 'f', 'g', null, 'h'],
            'age': [1, 9, 5, null, 20, 10, 6, 0, null],
            'good': [true, true, null, false, true, false, null, false, null]
        })

        it('should sort by string col correctly', () => {
            expect(table.desc('name')).toEqual(new Table({
                name: [
                    null, null, null,
                    'h', 'h', 'g',
                    'f', 'c', 'a'
                ],
                age: [
                    9, 20, 0, null,
                    null, 6, 10, 1,
                    5
                ],
                good: [
                    true, true, false,
                    false, null, null,
                    false, true, null
                ]
            }));
        });
        it('should sort by numeric col correctly', () => {
            expect(table.desc('age')).toEqual(new Table({
                name: [
                    'h', 'h', null,
                    'f', null, 'g',
                    'a', 'c', null
                ],
                age: [
                    null, null, 20, 10,
                    9, 6, 5, 1,
                    0
                ],
                good: [
                    false, null, true,
                    false, true, null,
                    null, true, false
                ]
            }));
        });
        it('should sort by boolean col correctly', () => {
            expect(table.desc('good')).toEqual(new Table({
                name: [
                    'a', 'g', 'h',
                    'c', null, null,
                    'h', 'f', null
                ],
                age: [
                    5, 6, null, 1,
                    9, 20, null, 10,
                    0
                ],
                good: [
                    null, null, null,
                    true, true, true,
                    false, false, false
                ]
            }));
        });
    })

    describe('groupby + aggregate', () => {
        const table = new Table({
            name: ['John', 'John', 'John', 'John', 'John', 'John', 'Bob'],
            age: [25, 25, 25, 30, 30, 30, 30],
            salary: [100, 200, 300, 400, 500, 600, 700]
        })
        it('should sum correctly', () => {
            expect(table.groupby('name', 'age').sum('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'sum(salary)': [600, 1500, 700],
            }));
        });
        it('should avg correctly', () => {
            expect(table.groupby('name', 'age').avg('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'avg(salary)': [200, 500, 700],
            }));
        });
        it('should max correctly', () => {
            expect(table.groupby('name', 'age').max('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'max(salary)': [300, 600, 700],
            }));
        });
        it('should min correctly', () => {
            expect(table.groupby('name', 'age').min('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'min(salary)': [100, 400, 700],
            }));
        });
        it('should count correctly', () => {
            expect(table.groupby('name', 'age').count('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'count(salary)': [3, 3, 1],
            }));
        });
        it('should array_agg correctly', () => {
            expect(table.groupby('name', 'age').array_agg('salary')).toEqual(new Table({
                'name': ['John', 'John', 'Bob'],
                'age': [25, 30, 30],
                'array_agg(salary)': [[100, 200, 300], [400, 500, 600], [700]],
            }));
        });
    })
    describe('groupby with null', () => {
        it('should sum and order by salary', () => {
            expect(new Table({
                name: ['John', 'John', 'John', 'John', 'John', 'John', 'Bob'],
                age: [null, 25, 25, null, 30, 30, 30],
                salary: [100, 200, 300, 400, 500, 600, 700]
            }).groupby('name', 'age').sum('salary').asc('sum(salary)')).toEqual(new Table({
                'name': ['John', 'John', 'Bob', 'John'],
                'age': [null, 25, 30, 30],
                'sum(salary)': [500, 500, 700, 1100]
            }));
        });
        it('should sum and order by name', () => {
            expect(new Table({
                name: ['John', 'John', 'John', 'John', 'John', 'John', 'Bob'],
                age: [null, 25, 25, null, 30, 30, 30],
                salary: [100, 200, 300, 400, 500, 600, 700]
            }).groupby('name').sum('salary').asc('name')).toEqual(new Table({
                'name': ['Bob', 'John'],
                'sum(salary)': [700, 2100]
            }));
        });
    })

    describe('should throw error when non existent column specified', () => {
        const A = new Table({
            name: ['a', 'a', 'b', 'c'],
            age: [1, 2, 3, 4]
        })
        const B = new Table({
            age: [1, 2, 3, 4],
            salary: [5, 6, 7, 8]
        })

        it('should throw error when col does not exist on left side', () => {
            expect(() => {
                A.leftJoin(B, 'salary');
            }).toThrow("Col salary does not exist on either or both side")
        });
        it('should throw error when col does not exist on right side', () => {
            expect(() => {
                A.leftJoin(B, 'name');
            }).toThrow("Col name does not exist on either or both side")
        });
    })

    describe('leftJoin', () => {
        it('should match all cols', () => {
            const A = new Table({
                name: ['a', 'a', 'b', 'c'],
                age: [1, 2, 3, 4]
            })
            const B = new Table({
                age: [1, 2, 3, 4],
                salary: [5, 6, 7, 8]
            })
            expect(A.leftJoin(B, 'age')).toEqual(new Table({
                name: ['a', 'a', 'b', 'c'],
                age: [1, 2, 3, 4],
                salary: [5, 6, 7, 8]
            }));
        });
        it('should keep null rows', () => {
            const A = new Table({
                name: ['a', 'a', 'b', 'c'],
                age: [1, 2, 3, 4]
            })
            const B = new Table({
                age: [1, 2, 5, 5],
                salary: [5, 6, 7, 8]
            })
            expect(A.leftJoin(B, 'age')).toEqual(new Table({
                name: ['a', 'a', 'b', 'c'],
                age: [1, 2, 3, 4],
                salary: [5, 6, null, null]
            }));
        });
        it('should keep null rows when nothing matches', () => {
            const A = new Table({
                name: ['a', 'a', 'b', 'c'],
                age: [1, 2, 3, 4]
            })
            const B = new Table({
                age: [5,5,5,5],
                salary: [5, 6, 7, 8]
            })
            expect(A.leftJoin(B, 'age')).toEqual(new Table({
                name: ['a', 'a', 'b', 'c'],
                age: [1, 2, 3, 4],
                salary: [null, null, null, null]
            }));
        });
    })

    describe('inner', () => {
        it('should match all cols', () => {
            const A = new Table({
                name: ['a', 'a', 'b', 'c'],
                age: [1, 2, 3, 4]
            })
            const B = new Table({
                age: [1, 2, 3, 4],
                salary: [5, 6, 7, 8]
            })
            expect(A.innerJoin(B, 'age')).toEqual(new Table({
                name: ['a', 'a', 'b', 'c'],
                age: [1, 2, 3, 4],
                salary: [5, 6, 7, 8]
            }));
        });
        it('should not keep null rows', () => {
            const A = new Table({
                name: ['a', 'a', 'b', 'c'],
                age: [1, 2, 3, 4]
            })
            const B = new Table({
                age: [1, 2, 5, 5],
                salary: [5, 6, 7, 8]
            })
            expect(A.innerJoin(B, 'age')).toEqual(new Table({
                name: ['a', 'a'],
                age: [1, 2],
                salary: [5, 6]
            }));
        });
        it('should be empty when nothing matches', () => {
            const A = new Table({
                name: ['a', 'a', 'b', 'c'],
                age: [1, 2, 3, 4]
            })
            const B = new Table({
                age: [5,5,5,5],
                salary: [5, 6, 7, 8]
            })
            expect(A.innerJoin(B, 'age')).toEqual(new Table({
                name: [],
                age: [],
                salary: []
            }));
        });
    })
});
