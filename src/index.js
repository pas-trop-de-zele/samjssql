const { Table } = require("./table");

let A = new Table({
    name: ['John', 'John', 'John', 'John', 'John', 'John', 'Bob'],
    age: [25, 25, 25, 30, 30, 30, 30],
    salary: [100, null, 300, 400, 500, 600, 700]
})
// console.log(A.groupby('name', 'age').sum('salary'));
console.log(A._getColType('salary'))