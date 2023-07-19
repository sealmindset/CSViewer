# Description

A React based application that creates a dynamic CSV table display with filtering, searching, column toggling, pagination, and the ability to view  detailed information for each row in a modal. Users can also download the filtered data as CSV or JSON files.

The CSV file should be in the standard format consisting of the first line containing the column headers, the the rows thereafter 
is the data.

## Install

```
git clone https://github.com/sealmindset/CSViewer.git
cd <path to>/CSViewer
```

### NPM Modules
To make sure all of the modules needed to run the app is installed, go to the `src` directory and run `setup.js`
```
cd <path to>/CSViewer/src
node setup.js
```
If there are any missing modules you will be asked if you want to install them.

## To Run
From within the `src` directory (i.e., whereever the App.js file is located.)
```
cd <path to>/CSViewer/src
npm start
```

### Browser
The app will automatically open a browser session to [http://localhost:3000](http://localhost:3000)

## Production
### `npm test`

Launches the test runner in the interactive watch mode.\

### `npm run build`

Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
Your app is ready to be deployed!
