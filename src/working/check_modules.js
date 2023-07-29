/* 
The script will read the App.js file, identify the required modules, check 
if they are installed, and prompt you to install any missing modules. 
If you choose to install the missing modules, it will use npm  
to install them for you.

To run:

node check_modules.js
*/

const fs = require('fs');
const { execSync } = require('child_process');

const appFilePath = './App.js';

// Read the App.js file
fs.readFile(appFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  const requiredModules = [];
  const importStatements = data.match(/import .* from "([^"]+)";/g) || [];
  importStatements.forEach((statement) => {
    const match = statement.match(/import .* from "([^"]+)";/);
    if (match && match[1]) {
      requiredModules.push(match[1]);
    }
  });

  const missingModules = requiredModules.filter((module) => !isModuleInstalled(module));

  if (missingModules.length > 0) {
    console.log('The following modules are required but not installed:');
    console.log(missingModules.join('\n'));

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question('Do you want to install the missing modules? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        installModules(missingModules);
      } else {
        console.log('Exiting the script.');
      }
      readline.close();
    });
  } else {
    console.log('All required modules are already installed.');
  }
});

function isModuleInstalled(moduleName) {
  try {
    require.resolve(moduleName);
    return true;
  } catch (err) {
    return false;
  }
}

function installModules(modules) {
  try {
    console.log('Installing the missing modules...');
    execSync(`npm install ${modules.join(' ')}`, { stdio: 'inherit' });
    console.log('Modules installed successfully.');
  } catch (err) {
    console.error('Error occurred during module installation:', err);
  }
}

