# Description
The purpose of the project is to create a dynamic CSV table display with various features and functionalities to facilitate data exploration, filtering, searching, and analysis. The project aims to provide a user-friendly interface for visualizing and interacting with CSV data in a web application.

Key purposes and features of the project include:

CSV Data Display: The project allows users to upload a CSV file and displays its contents in a tabular format.
Filtering and Searching: Users can filter and search the data based on specific criteria for each column. This makes it easy to narrow down the dataset and find relevant information.
Column Toggling: Users can choose which columns to display or hide, giving them the flexibility to focus on specific aspects of the data.
Pagination: The table supports pagination, allowing users to navigate through large datasets conveniently.
Detailed Row Information: Clicking on a row in the table opens a modal displaying detailed information about that particular row.
Download Options: Users can download the filtered data as CSV or JSON files, which provides an efficient way to export the data for further analysis or reporting.

The use case scenarios include:

Data Analysis: Researchers, analysts, and data scientists can use the tool to explore and analyze datasets quickly without the need for complex data processing tools.
Data Visualization: The dynamic CSV table makes it easier to visualize and interact with data, making it more accessible to users.
Data Management: Users can manage, filter, and download specific portions of the dataset based on their needs.
Data Exploration: The project allows users to gain insights and patterns from large datasets by filtering and searching for specific information.
Overall, the project's purpose is to provide an effective and user-friendly way to work with CSV data, enabling users to interact with the data, analyze it, and extract relevant information efficiently.

# CSV file with JSON Strings in a column
An example of a CSV file with multi-layer nested key-value pairs and non-nested columns. In this example, the CSV data will include information about individuals, including their name, age, email, address details, phone number, and occupation. The address details will be nested within the "address" column, which includes "house," "street," "city," and "zip" as sub-columns.

Here's how the CSV file might look:

```
name,age,email,address,phone,occupation
John Doe,30,john.doe@example.com,{address:{house:123,street:{name:Elm St,city:New York},zip:10001}},555-1234,Software Engineer
```

In this CSV data:

Each row represents an individual.
The "name," "age," "email," "phone," and "occupation" columns are not nested; they are direct key-value pairs.
The "address" column contains nested information, with "house," "street" (containing "name," "city," and "zip" as sub-columns).
When you parse this CSV data, the resulting data structure in JavaScript might look something like this:

```
const data = [
  {
    name: 'John Doe',
    age: '30',
    email: 'john.doe@example.com',
    address: {
      house: '123 Main St',
      street: {
        name: 'Apt 4A',
        city: 'New York',
        zip: '10001',
      },
    },
    phone: '555-1234',
    occupation: 'Software Engineer',
  },
```

# ToDo
Look to GPT to provide analysis.

# Setup
To set up and run the project, follow these step-by-step instructions:

### Step 1: Clone repo

### Step 2: Navigate to the Project Directory
Change the directory to the newly created project:

```
cd CSViewer
```

### Step 3: Install Dependencies
In this project, we need additional dependencies: papaparse, react-modal, and react-data-table-component. To install them, run the following command:

```
node src/check_modules.js
```

### Step 4: Run the Development Server
Now, you are ready to run the React development server. In the project directory, run the following command:

```
npm start
```

This will start the development server and open the app in your default web browser. If it doesn't open automatically, you can access the app by navigating to http://localhost:3000 in your browser.

### Step 5: Test the Application
Once the app is running, you can upload the data.csv file using the "Choose File" button. The CSV data will be displayed in a dynamic table with various features such as filtering, searching, column toggling, pagination, and the ability to view detailed information for each row in a modal. You can also download the filtered data as CSV or JSON files by clicking on the corresponding buttons.
