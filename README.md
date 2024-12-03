# Hower
A time management system that improves upon the ability to manage and keep track of time. Hower enables users to put the power back in how they get things done. Life should be lived doing, rather than planning.

Check the requirements.txt file to make sure you have all necessary dependencies installed before running the app.

## To Run the Flask Backend Server in a Browser:

In the terminal, navigate to the repository, and run tset test:

```
python run.py
```

It should provide an address for you to access the app on your browser, paste that address into your browser (preferably Chrome) and run as a basic html/css website.

## To Run the Electron Frontend Application:

In the terminal, navigate to the repository, and run:

```
npm start
``` 

The application should open in a new window.

## Note on using the app

In our current code base, when you start the Electron app with npm, it has already included the start of our backend Flask server on port 5000. Therefore, if you want to start the two server separately, make sure to comment the part in our electron-main.js file that start the python backend server.
