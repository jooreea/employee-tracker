// Require packages
const inquirer = require('inquirer');
const mysql = require('mysql2');
const consoleTable = require('console.table');
// Connect to database
const db = mysql.createConnection(
    {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'company_db'
    },
    console.log(`Connected to company_db.`)
);
// Command line app initializing function
async function startApp() {
    let menuPrompt = await inquirer.prompt({
        message: "What would you like to do?",
        name: "menuChoice",
        type: "list",
        choices: [
            "View All Employees", 
            "Add Employee", 
            "Update Employee Role",
            "View All Roles", 
            "Add Role", 
            "View All Departments", 
            "Add Department", 
            "Quit"
        ],
    });
    if (menuPrompt.menuChoice == 'View All Employees') {
        await viewEmployees(); 
    } else if (menuPrompt.menuChoice == 'View All Roles') {
        await viewRoles(); 
    } else if (menuPrompt.menuChoice == 'View All Departments') {
        await viewDepartments(); 
    } else if (menuPrompt.menuChoice == 'Add Department') {
        await addDepartment(); 
    } else if (menuPrompt.menuChoice == 'Add Role') {
        await addRole();
    } else if (menuPrompt.menuChoice == 'Add Employee') {
        await addEmployee();
    } else if (menuPrompt.menuChoice == 'Update Employee Role') {
        await updateEmployee();
    } else if (menuPrompt.menuChoice == 'Quit') {
        process.exit();
    };
    startApp();
};
// Functions that execute inquirer and db queries
async function viewEmployees() {
    try {
        let employeeView = await db.promise().query(`SELECT employee.id, first_name, last_name, title, salary, name AS department, manager FROM employee JOIN role ON employee.role_id = role.id JOIN department ON role.department_id = department.id LEFT JOIN(SELECT id, CONCAT(first_name, ' ', last_name) AS manager FROM employee) AS m ON employee.manager_id = m.id`);
        let employeeTbl = consoleTable.getTable(employeeView[0]);
        console.log('\n', employeeTbl);   
    } catch (err) {
        console.log(err);
    };
};
async function viewRoles() {
    try {
        let roleView = await db.promise().query(`SELECT role.id, title, name AS department, salary FROM role JOIN department ON role.department_id = department.id`);
        let roleTbl = consoleTable.getTable(roleView[0]);
        console.log('\n', roleTbl);
    } catch (err) {
        console.log(err);
    }
};
async function viewDepartments() {
    let departmentView = await db.promise().query(`SELECT id, name FROM department`);
    let departmentTbl = consoleTable.getTable(departmentView[0])
    console.log('\n', departmentTbl);
};
async function addDepartment() {
    try {
        let deptAnswers = await inquirer.prompt({
            message: "What is the name of the department?",
            name: "departmentName",
            type: "input",
        });
        let deptName = deptAnswers.departmentName;
        await db.promise().query(`INSERT INTO department (name) VALUES (?)`, [deptName]);
        console.log(`Added ${deptName} to the database`);
    } catch(err) {
        console.log(err);
    }
};
async function addRole() {
    try {
        let deptResult = await db.promise().query(`SELECT id, name FROM department`);
        let allDepartments = deptResult[0].map(({ name }) => (
            name
        ));
        let roleAnswers = await inquirer.prompt([
            {
                message: "What is the name of the role?",
                name: "roleName",
                type: "input",
            },
            {
                message: "What is the salary of the role?",
                name: "roleSalary",
                type: "input",
            },
            {
                message: "Which department does the role belong to?",
                name: "roleDepartment",
                type: "list",
                choices: allDepartments
            },
        ]);
        let deptName = roleAnswers.roleDepartment;
        let roleName = roleAnswers.roleName;
        let roleSalary = roleAnswers.roleSalary;
        let deptRow = deptResult[0].filter(function(dept) {
            return dept.name == deptName;
        });
        let deptId = deptRow[0].id;
        await db.promise().query(`INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)`, [roleName, roleSalary, deptId]);
        console.log(`Added ${roleName} to the database`);
    } catch(err) {
        console.log(err);
    };
};
async function addEmployee() {
    try {
        let roleResult = await db.promise().query(`SELECT id, title FROM role`);
        let allRoles = roleResult[0].map(({ title }) => (
            title
        ));
        let managerResult = await db.promise().query(`SELECT DISTINCT e.id AS manager_id, CONCAT(e.first_name, ' ',  e.last_name) AS manager_name FROM employee AS m JOIN employee AS e ON m.manager_id = e.id WHERE m.manager_id IS NOT NULL`);
        let allManagers = managerResult[0].map(({ manager_name }) => (
            manager_name
        ));
        let employeeAnswers = await inquirer.prompt([
            {
                message: "What is the employee's first name?",
                name: "employeeFirstName",
                type: "input",
            },
            {
                message: "What is the employee's last name?",
                name: "employeeLastName",
                type: "input",
            },
            {
                message: "What is the employee's role?",
                name: "employeeRole",
                type: "list",
                choices: allRoles,
            },
            {
                message: "Who is the employee's manager?",
                name: "employeeManager",
                type: "list",
                choices: allManagers,
            },
        ]);
        let empFirstName = employeeAnswers.employeeFirstName;
        let empLastName = employeeAnswers.employeeLastName;
        let empRole = employeeAnswers.employeeRole;
        let roleRow = roleResult[0].filter(function(role) {
            return role.title == empRole;
        });
        let roleId = roleRow[0].id;
        let empManager = employeeAnswers.employeeManager;
        let manRow = managerResult[0].filter(function(manager) {
            return manager.manager_name == empManager;
        });
        let manId = manRow[0].manager_id;
        await db.promise().query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)`, [empFirstName, empLastName, roleId, manId]);
        console.log(`Added ${empFirstName} ${empLastName} to the database`);
    } catch(err) {
        console.log(err);
    };
};
async function updateEmployee() {
    try {
        let roleResult = await db.promise().query(`SELECT id, title FROM role`);
        let allRoles = roleResult[0].map(({ title }) => (
            title
        ));
        let employeeResult = await db.promise().query(`SELECT id AS employee_id, role_id, CONCAT(first_name, ' ', last_name) AS employee_name FROM employee`);
        let allEmployees = employeeResult[0].map(({ employee_name }) => (
            employee_name
        ));
        let updateAnswers = await inquirer.prompt([
            {
                message: "Which employee's role do you want to update?",
                name: "updateEmployee",
                type: "list",
                choices: allEmployees,
            },
            {
                message: "Which role do you want to assign to the selected employee?",
                name: "updateRole",
                type: "list",
                choices: allRoles,
            },
        ]);
        let updEmp = updateAnswers.updateEmployee;
        let updEmpRow = employeeResult[0].filter(function(employee) {
            return employee.employee_name == updEmp;
        });
        let empId = updEmpRow[0].employee_id;
        let updRole = updateAnswers.updateRole;
        let updRoleRow = roleResult[0].filter(function(role) {
            return role.title == updRole;
        });
        let newEmpRoleId = updRoleRow[0].id;
        await db.promise().query(`UPDATE employee SET role_id = ? WHERE id = ?`, [newEmpRoleId, empId]);
        console.log(`Updated ${updEmp}'s role to ${updRole} in the database`);
    } catch(err) {
        console.log(err);
    };
};
startApp();