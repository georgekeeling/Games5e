I used this project to learn or re-learn about Typescript, JavaScript, Visual Studio, Html, CSS, PHP and more. It implements the "5 great games of patience".

The live game can be accessed at https://p5g.racingdemon.net/ 

The project is created as a PHP project / solution which can access both a local database and the website database (both MySQL). See 'Solution / Project set up in Visual Studio' below. Solution contains one project: games5e. There are two possible start pages: the main one is index.html which fires up the game code; the other is userTester.html which has some database test functions. They both access the database using (slightly unorthodox) AJAX to db/dbInterface.php. The db subdirectory also contains the database schema and topSecret.php which is set up to access the local test database for debugging. When uploading to the website care must be taken not to overwrite the topSecret.php's there. 

It would be easy to disconnect the database functions to run the project more simply or as a pure Typescript project.

There is much more documentation in an MS-Word file here
https://docs.google.com/document/d/1oxzT_DAfXLtY6dbxxaEVQSR6v-f0fNDw

George Keeling 2024, Berlin