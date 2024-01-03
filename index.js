const inquirer = require ('inquirer');
const db = require ('./db/db');

function startApp() {
    inquirer
      .prompt({
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'View all departments',
          'View all roles',
          'View all employees',
          'Add a department',
          'Add a role',
          'Add an employee',
          'Update an employee role',
          'Exit',
        ],
      })
      .then((answer) => {
        switch (answer.action) {
          case 'View all departments':
            viewDepartments();
            break;
          case 'View all roles':
            viewRoles();
            break;
          case 'View all employees':
            viewAllEmployees();
            break;
          case 'Add a department':
            addDepartment();
            break;
          case 'Add a role':
            addRole();
            break;
          case 'Add an employee':
            addEmployee();
            break;
          case 'Update an employee role':
            updateEmployeeRole();
            break;
          case 'Exit':
            console.log('Exiting application');
            db.end(); 
            break;
        }
      });
  }

  function viewDepartments() {
    const query = 'SELECT * FROM department';
  
    db.query(query, (err, results) => {
      if (err) throw err;
  
      console.table(results);
  
      startApp();
    });
  }
  
  function viewRoles() {
    const query =
      'SELECT role.id, role.title, role.salary, department.name AS department FROM role LEFT JOIN department ON role.department_id = department.id';
  
    db.query(query, (err, results) => {
      if (err) throw err;
  
      console.table(results);
  
      startApp();
    });
  }
  
  function viewAllEmployees() {
    const viewAllEmployeesQuery = `
      SELECT 
          employees.id, 
          employees.first_name, 
          employees.last_name, 
          role.title AS role,
          role.salary,
          department.name AS department,
          CONCAT(manager.first_name, ' ', manager.last_name) AS manager
      FROM employees
      LEFT JOIN role ON employees.role_id = role.id
      LEFT JOIN department ON role.department_id = department.id
      LEFT JOIN employees AS manager ON employees.manager_id = manager.id;
    `;
  
    db.query(viewAllEmployeesQuery, (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        throw err;
      }
  
      console.log('Query Results:', results);
      console.table(results);
  
      startApp();
    });
  }  

  function addDepartment() {
    inquirer
      .prompt({
        type: 'input',
        name: 'name',
        message: 'Enter the name of the department:',
      })
      .then((answer) => {
        const query = 'INSERT INTO department SET name = ?'; 
  
        db.query(query, [answer.name], (err, results) => {
          if (err) throw err;
  
          console.log('Department added successfully!');
          startApp();
        });
      });
  }
  
  function addRole() {
    inquirer
      .prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Enter the name of the role:',
        },
      ])
      .then((answer) => {
        const query = 'INSERT INTO role SET ?';
        db.query(query, { title: answer.title }, (err, results) => {
          if (err) throw err;
  
          console.log('Role added successfully!');
          startApp();
        });
      });
  }

  async function getDepartmentChoices() {
    const departmentQuery = 'SELECT name FROM department';
    
    try {
        const [departments] = await db.promise().query(departmentQuery);
        return departments.map((department) => ({
            name: department.name,
            value: department.name,
        }));
    } catch (error) {
        console.error('Error fetching department names:', error);
        return [];
    }
}

async function addEmployee() {
  const departmentChoices = await getDepartmentChoices();

  inquirer
      .prompt([
          {
              type: 'input',
              name: 'first_name',
              message: 'Enter your first name.',
          },
          {
              type: 'input',
              name: 'last_name',
              message: 'Enter your last name.',
          },
          {
              type: 'input',
              name: 'role',
              message: 'Enter the name of the role.',
          },
          {
              type: 'input',
              name: 'salary',
              message: 'Enter the salary for this role (e.g., 30000.00):',
          },
          {
              type: 'rawlist',
              name: 'department',
              message: 'Choose the department for this role:',
              choices: departmentChoices,
          },
          {
              type: 'input',
              name: 'manager',
              message: 'Enter the manager name.',
          },
      ])
      .then((answers) => {
          const roleQuery = 'SELECT id FROM role WHERE title = ?';
          db.query(roleQuery, [answers.role], (roleErr, roleResults) => {
            if (roleErr) throw roleErr;

            if (roleResults.length === 0) {
             console.log('Role not found. Please add the role first.');
              startApp();
              return;
            }

       const managerQuery = 'SELECT id FROM employees WHERE CONCAT(first_name, " ", last_name) = ?';
            db.query(managerQuery, [answers.manager], (managerErr, managerResults) => {
            if (managerErr) throw managerErr;

          const departmentQuery = 'SELECT id FROM department WHERE name = ?';
          db.query(departmentQuery, [answers.department], (deptErr, deptResults) => {
          if (deptErr) throw deptErr;

          const insertQuery = 'INSERT INTO employees SET ?';
          const newEmployee = {
          first_name: answers.first_name,
          last_name: answers.last_name,
          role_id: roleResults[0].id,
          salary: answers.salary,
          department_id: deptResults[0].id,
          manager_id: managerResults[0] ? managerResults[0].id : null,
          };

          db.query(insertQuery, newEmployee, (insertErr, insertResults) => {
          if (insertErr) throw insertErr;

          console.log('Employee added successfully!');
          startApp();
              });
            });
          });
       });
      });
}


  function updateEmployeeRole() {
    const employeeQuery = 'SELECT id, CONCAT(first_name, " ", last_name) AS employeeName FROM employees';
  
    db.query(employeeQuery, (err, employees) => {
      if (err) throw err;
  
      inquirer
        .prompt([
          {
            type: 'list',
            name: 'employeeId',
            message: 'Select the employee to update:',
            choices: employees.map((employee) => ({
              name: employee.employeeName,
              value: employee.id,
            })),
          },
          {
            type: 'input',
            name: 'newRoleId',
            message: 'Enter the new role ID:',
          },
        ])
        .then((answers) => {
          const updateQuery = 'UPDATE employees SET role_id = ? WHERE id = ?';
  
          db.query(updateQuery, [answers.newRoleId, answers.employeeId], (updateErr, updateResults) => {
            if (updateErr) throw updateErr;
  
            console.log('Employee role updated successfully!');
  
            startApp();
          });
        });
    });
  }

startApp();