I used this project to learn or re-learn about Typescript, JavaScript, Visual Studio, Html, CSS, PHP and more. It implements the "5 great games of patience".

The live game can be accessed at https://patience5games.com/ 
A test version can be accessed at https://patience5games.com/t1

The project is created as a PHP project / solution which can access both a local database and the website database (both MySQL). See 'Solution / Project set up in Visual Studio' below. Solution contains one project: games5c. There are two possible start pages: the main one is index.html which fires up the game code; the other is userTester.html which has some database test functions. They both access the database using (slightly unorthodox) AJAX to db/dbInterface.php. The db subdirectory also contains the database schema db schema 2023-03-04.sql and topSecret.php which is set up to access the local test database for debugging. When uploading to the website care must be taken not to overwrite the topSecret.php's there. There are two versions, one for accessing a test database and another for the live database.

It would be easy to disconnect the database functions to run the project more simply or as a pure Typescript project.

There is much more documentation in an MS-Word file here
https://docs.google.com/document/d/1oxzT_DAfXLtY6dbxxaEVQSR6v-f0fNDw

George Keeling March 2023, Berlin