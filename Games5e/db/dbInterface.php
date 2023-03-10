<?php declare(strict_types=1);

  // My bodge got the simple db interface using $_SERVER["CONTENT_TYPE"] to hold message!
  $message = $_SERVER["CONTENT_TYPE"];
  $ipAddress = $_SERVER['REMOTE_ADDR'];
  $dbTimeZone = "America/Denver";
  if ($ipAddress == "::1"){
    // debugging
    $ipAddress = "91.41.debug";
    $dbTimeZone = "Europe/Berlin";
  }
  $user = parse($message, 1);
  $actionType = parse($message, 2);
  $gameCode = parse($message, 3);
  $type = parse($message, 4);

  switch ($actionType){
    case "Post":
      makePost();
      break;
    case "List":
      // message like user/List/timediff
      report(1, (int)parse($message, 3));
      break;
    case "ListSort":
      // message like user/ListSort/col/timediff
      report((int)parse($message, 3), (int)parse($message, 4));
      break;
    case "Time":
      // message like user/Timetimediff
      timeTest((int)parse($message, 3));
      break;
    case "ScoreIP":
      // message like user/ScoreIP/timediff
      scoreIP($ipAddress, (int)parse($message, 3));
      break;
    case "ScoreUser":
      // message like user/Score/timediff
      scoreUser($user, (int)parse($message, 3));
      break;
    case "LogIn":
      // message like user/LogIn/password
      logIn(parse($message, 1),parse($message, 3));
      break;
    case "CreateUser":
      // message like user/CreateUser/password
      createUser(parse($message, 1),parse($message, 3));
      break;
    case "League":
      // message like user/League
      league();
      break;
    case "Transfer":
      // message like user/Transfer
      transferIPtoUser($ipAddress, $user);
      break;
    default:
      echo "unknown command";
  }

  function timeTest(int $clientTZOffsetMins) {
  // $clientTZOffsetMins is client time zone offset from GMT/UTC in minutes.
  // Client time + $clientTZOffsetMins = UTC.
  // in Berlin $clientTZOffsetMins = - 60

    // list time and time zone on DB server, php server and client.

    echo '<table><tr><th align="left">What</th>';
    echo '<th align="left">Date/time </th>';
    echo '<th align="left">Time zone</th>';
    echo '<th align="left">Offset to UTC/GMT hours</th>';
    echo  '</tr>';

    $PHPdate = date_create("now");   // "now" or, for example "2023/02/15 11:39"
    $PHPtz = date_timezone_get($PHPdate);
    $PHPtzName = timezone_name_get($PHPtz);
    $PHPtzOffsetSecs = timezone_offset_get($PHPtz,$PHPdate);

    echo '<tr><td align="left">PHP server</td><td align="left">' . date_format($PHPdate,"Y/m/d  H:i:s") . '</td>';
    echo '<td align="left">' . $PHPtzName . '</td>';
    echo '<td align="left">' . $PHPtzOffsetSecs / 3600 . '</td>';
    echo '</tr>';

    $CLIENTdate = $PHPdate;
    date_add($CLIENTdate,
      date_interval_create_from_date_string (($PHPtzOffsetSecs + $clientTZOffsetMins * 60 ) . " seconds") );
    $CLIENTtzName = "UTC/GMT+ " . - $clientTZOffsetMins / 60;
    $CLIENTtzOffset = - $clientTZOffsetMins / 60;

    echo '<tr><td align="left">Client</td><td align="left">' . date_format($CLIENTdate,"Y/m/d  H:i:s") . '</td>';
    echo '<td align="left">' . $CLIENTtzName . '</td>';
    echo '<td align="left">' . $CLIENTtzOffset . '</td>';
    echo '</tr>';

    global $dbTimeZone;
    $DBdate = $PHPdate;
    $DBtz = timezone_open($dbTimeZone);
    $DBtzOffsetSecs = timezone_offset_get($DBtz,$DBdate);
    date_add($DBdate,
      date_interval_create_from_date_string (($DBtzOffsetSecs - $PHPtzOffsetSecs) . " seconds") );

    echo '<tr><td align="left">DB</td><td align="left">' . date_format($DBdate,"Y/m/d  H:i:s") . '</td>';
    echo '<td align="left">' . $dbTimeZone . '</td>';
    echo '<td align="left">' . $DBtzOffsetSecs / 3600 . '</td>';
    echo '</tr>';

    echo '</table>';

  }

  function calcTimeZoneDiff ($tz1, $tz2, $date) {
    $gmtOff1 = timezone_offset_get($tz1,$date) / 3600;
    $gmtOff2 = timezone_offset_get($tz2,$date) / 3600;
    return ($gmtOff1 - $gmtOff2);
  }

  function makePost () {
    global $actionType;
    global $gameCode;
    global $type;
    global $user;
    global $ipAddress;
    $conn = openConnection ();
    $sql = "INSERT INTO Action (VisitorID, IPaddress, GameCode, Type) VALUES ('" .
      $user . "','" . $ipAddress . "','" . $gameCode . "','" . $type . "');";

    if ($conn->query($sql)) {
      echo "Result: OK";
    } else {
      echo "Error: " . $conn->error;
    }
    $conn->close();
  }

  function report (int $sortCol, int $timeDiff) {

    $conn = openConnection ();
    switch ($sortCol){
      case 1:
        $sql = "SELECT * FROM Action;";
        break;
      case 2:
        $sql = "SELECT * FROM Action ORDER BY VisitorId;";
        break;
      case 3:
        $sql = "SELECT * FROM Action ORDER BY IPaddress;";
        break;
      case 4:
        $sql = "SELECT * FROM Action ORDER BY GameCode;";
        break;
      case 5:
        $sql = "SELECT * FROM Action ORDER BY Type;";
        break;
      default:
        echo 'Unknown column';
        exit;
    }

    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
      echo '<table><tr>';
      echo columnHeading (1, "Time", $sortCol == 1);
      echo columnHeading (2, "VisitorId",  $sortCol == 2);
      echo columnHeading (3, "IP Address",  $sortCol == 3);
      echo columnHeading (4, "Game",  $sortCol == 4);
      echo columnHeading (5, "Type",  $sortCol == 5);

      // output data of each row
      while($row = $result->fetch_assoc()) {
        $actionDate = getLocalDateTime($row["Time"] , $timeDiff);
        echo "<tr><td>" .  date_format($actionDate,"Y-m-d  H:i:s") . "</td><td>" . $row["VisitorID"]. "</td><td>" .
          $row["IPaddress"]. "</td><td>" . $row["GameCode"]. "</td><td>" . $row["Type"]. "</td><tr>";
      }
      echo "</table>";
      echo "Rows " . $result->num_rows;
    } else {
      echo "0 results";
    }
    $conn->close();
  }

  function getLocalDateTime (string $DBdateTime, int $clientTzOffsetMins) : DateTime {
    global $dbTimeZone;
    $actionDate = date_create($DBdateTime, timezone_open($dbTimeZone));
    $tzDB = timezone_open($dbTimeZone);
    $DBtzOffsetMins = timezone_offset_get($tzDB,$actionDate) / 60;
    date_add($actionDate , date_interval_create_from_date_string(
      - $DBtzOffsetMins - $clientTzOffsetMins . " minutes"));
    return $actionDate;
  }


  function columnHeading (int $col, string $text, bool $sortCol) : string {
    // produce heading like
    // $heading = '<th align="left">Time <img src="downArrow.png" onclick="userTester.sort(1)" > </th>';
    //                              ****           *************                *
    // It would be better if the callback function was parameter sent by client.
    $heading = '<th align="left">' . $text . ' <img src="';
    if ($sortCol){
      $heading .= 'img/downArrow.png';
    } else {
      $heading .= 'img/downArrowDis.png';
    }
    $heading .= '" onclick="userTester.sort(' . $col . ')" > </th>';

    return $heading;
  }

  function openConnection () : object {
    // Create connection
    include 'topSecret.php';
    $conn = new mysqli($servername, $username, $password, $dbname);
    // Check connection
    if ($conn->connect_error) {
      die("Connection failed: " . $conn->connect_error);
    }
    return $conn;
  }

  function parse (string $message, int $item) : string {
    // $message is in form xx/xxxxxx/xxxx ...
    // $item is 1,2,3 ...
    // extract nth item from message
    $parts = explode("/", $message);
    if ($item <= count($parts)) {
      return $parts[$item - 1];
    }
    return "";
  }
  function transferIPtoUser (string $ipAddress, string $user){
    // transfer games shown in scoreIP to $user
    $conn = openConnection ();
    $sql = "UPDATE Action SET VisitorID = '" . $user . "' WHERE IPaddress = '" . $ipAddress . "' AND VisitorID = 'unknown';";
    if ($conn->query($sql)) {
      echo "Result: OK";
    } else {
      echo "Error: " . $conn->error;
    }
    $conn->close();

  }
  function scoreIP (string $ipAddress, int $timeDiff) {
    // show score by IP address
    $conn = openConnection ();
    $sql = "SELECT Time, GameCode, Type FROM Action WHERE IPaddress = '" . $ipAddress . "' AND VisitorID = 'unknown';";
    score ($conn, $sql , $timeDiff, false, "");
    $conn->close();
  }

  function scoreUser (string $user, int $timeDiff) {
    // show score of user
    $conn = openConnection ();
    $sql = "SELECT Time, GameCode, Type FROM Action WHERE VisitorID = '" . $user . "';";
    score ($conn, $sql , $timeDiff, false, $user);
    $conn->close();
  }

  function league(){
    // https://www.php.net/manual/en/function.array-multisort.php
    // could use array_multisort to sort 2D array, but leave it all to javascript
    // return rows like
    // user_name/ 1/2/3/4/5/6/
    // where first number is total, second is AA score, then 7&6, SW, UR ,Ks
    $conn = openConnection ();
    $result = $conn->query("SELECT Name FROM Visitor;");

    if ($result->num_rows > 0) {
      while($row = $result->fetch_assoc()) {
        $user = $row["Name"];
        $sql = "SELECT Time, GameCode, Type FROM Action WHERE VisitorID = '" . $user . "';";
        $LeaguePoints = score ($conn, $sql , 0, true, "");
        echo $user . "/";
        for ($col = 0; $col <= 5; $col++) {
          echo $LeaguePoints[$col] . "/";
        }
      }
    }
    $conn->close();

  }

  function score (mysqli $conn, string $sql, int $timeDiff, bool $rl, string $user) : array {
    // Present score for $user or $ipAddress in format as prescribed by MEAK
    // $result is type mysqli_result see https://www.php.net/manual/en/mysqli-result.fetch-all.php
    // if $rl is true, we just want to return the league totals for the person
    // if not blank, $user in heading
    $result = $conn->query($sql);
    $rows = $result->fetch_all(MYSQLI_ASSOC);     // num $rows = count($rows) = $result->num_rows. Needs PHP 8.1!!
    $played = array (0,0,0,0,0,0);
    $wins = array (0,0,0,0,0,0);
    $smallWins = array (0,0,0,0,0,0);
    $LeaguePoints = array (0,0,0,0,0,0);
    $gameCode = array ("Total", "AA", "7&amp;6", "SW", "UR", "Ks", "??");
    $gameI = 0;   // 0 = all, 1 = AuntyAlice, 5 = UncleRemus bla see switch below
    $loseWin = "";
    $prevWins = array();   // checks for wins in a row

    if ($result->num_rows > 0) {
      echoIf ($rl, '<table>');
      if ($user != ""){
        echoIf ($rl, '<tr><th colspan="9" align="center" ><u>Games of ' . $user . '</u></th></tr>');
      }
      echoIf ($rl, '<tr>');
      echoIf ($rl, '<th align="left">Date </th>');
      echoIf ($rl, '<th align="left">Game </th><th align="left">Comment </th><th></th>');
      echoIf ($rl, '<th align="left">Aunty<br>Allis</th>');
      echoIf ($rl, '<th align="left">Seven<br>&amp; six</th>');
      echoIf ($rl, '<th align="left">Senior<br>Wrangler</th>');
      echoIf ($rl, '<th align="left">Uncle<br>Remus</th>');
      echoIf ($rl, '<th align="left">Kings</th>');
      echoIf ($rl,  '</tr>');
      for ($rowNr = 0; $rowNr < $result->num_rows; $rowNr++) {
        $row = $rows[$rowNr];
        $actionDate = getLocalDateTime($row["Time"], $timeDiff);
        if ($row["Type"] == "Start") {
          if ($rowNr < $result->num_rows - 1) {
            if ($rows[$rowNr + 1]["Type"] != "Start"){
              $row["Type"] = $rows[$rowNr + 1]["Type"];
              $rowNr++;
            } else {
              $row["Type"] = "Lost";
            }
          } else {
            // final row is Start
            $row["Type"] = "Lost";
          }
        }

        switch ($row["GameCode"]) {
          case "AuntyAlice":
            $gameI = 1;
            break;
          case "SandS":
            $gameI = 2;
            break;
          case "SeniorWrangler":
            $gameI = 3;
            break;
          case "UncleRemus":
            $gameI = 4;
            break;
          case "Kings":
            $gameI = 5;
            break;
          default:
            $gameI = 6;
        }
        $played[0]++;
        $played[$gameI]++;
        switch($row["Type"]){
          case "Won":
            $wins[$gameI]++;
            $wins[0]++;
            $loseWin = "W";
            $nextWin = count($prevWins);
            $prevWins[$nextWin][0] = $gameI;
            $prevWins[$nextWin][1] = $actionDate;
            break;
          case "Lost":
            $loseWin = "L";
            $prevWins = array();
            break;
          default:
            $smallWins[$gameI]++;
            $smallWins[0]++;
            $loseWin = "w";
            $prevWins = array();
            break;

        }

        echoIf ($rl, "<tr><td>" .  date_format($actionDate,"Y-m-d") . "</td><td>" . $gameCode[$gameI] .
          "</td><td>" . $row["Type"] . checkTripleCrown($prevWins) . "</td><td></td>");
        for ($col = 1; $col <= 5; $col++) {
          if ($col == $gameI){
            echoIf ($rl, '<td  align="center">' . $loseWin . "</td>");
          } else {
            echoIf ($rl, "<td></td>");
          }
        }
        echoIf ($rl, "</tr>");
      }

      // Totals **************
      echoIf ($rl, '<tr><td><br></td></tr>');
      echoIf ($rl, '<tr><td></td><td></td><td align="left">Summary</td><td align="center">Total</td>');
      echoIf ($rl, '<td align="center">AA</td><td align="center">7&amp;6</td><td align="center">SW</td>' .
        '<td align="center">UR</td><td align="center">Ks</td></tr>');
      echoIf ($rl, '<tr><td></td><td></td><td align="left">Wins</td>');
      for ($col = 0; $col <= 5; $col++) {
        echoIf ($rl, '<td align="center">' . $wins[$col] . '</td>');
      }
      echoIf ($rl, '</tr>');

      echoIf ($rl, '<tr><td></td><td></td><td align="left">Played</td>');
      for ($col = 0; $col <= 5; $col++) {
        echoIf ($rl, '<td align="center">' . $played[$col] . '</td>');
      }
      echoIf ($rl, '</tr>');

      echoIf ($rl, '<tr><td></td><td></td><td align="left">Percent wins</td>');
      for ($col = 0; $col <= 5; $col++) {
        if ($played[$col] == 0) {
          echoIf ($rl, '<td align="center">--</td>');
        } else {
          echoIf ($rl, '<td align="center">' . round($wins[$col]/$played[$col] * 100) . '%</td>');
        }
      }
      echoIf ($rl, '</tr>');

      echoIf ($rl, '<tr><td></td><td></td><td align="left">Small wins</td>');
      for ($col = 0; $col <= 5; $col++) {
        echoIf ($rl, '<td align="center">' . $smallWins[$col] . '</td>');
      }
      echoIf ($rl, '</tr>');

      echoIf ($rl, '<tr><td></td><td></td><td align="left">League points</td>');
      for ($col = 1; $col <= 5; $col++) {
        if ($played[$col] >= 9) {
          $LeaguePoints[$col] = round($wins[$col]/$played[$col] * 20);
          $LeaguePoints[0] += $LeaguePoints[$col];
        } else {
          // get a point if they have won one or more games
          if ($wins[$col] > 0) {
            $LeaguePoints[$col] = 1;
            $LeaguePoints[0] += 1;
          }
        }
      }
      for ($col = 0; $col <= 5; $col++) {
        echoIf ($rl, '<td align="center">' . $LeaguePoints[$col] . '</td>');
      }
      echoIf ($rl, '</tr>');

      echoIf ($rl, "</table>");
      echoIf ($rl, "<br>League points per game are ranked out of 20 if 9 or more games have been played <br>");
      echoIf ($rl, "If less than 9 have been played, one point is awarded for one or more wins.");
    } else {
      echoIf ($rl, "no results");
    }
    return $LeaguePoints;

  }

  function echoIf (bool $returnLeague, string $message){
    if (!$returnLeague) {
      echo $message;
    }
  }

  function checkTripleCrown (array $prevWins): string {
    // check if triple crown or better
    // must be different games and done in less than 3,4 or 5 hours
    $numWins = count($prevWins);
    if ($numWins < 3) {
      return "";
    }
    $diff = date_diff($prevWins[0][1], $prevWins[$numWins - 1][1]);
    if ($diff->y > 0 || $diff->d > 0) {
      return "";
    }
    $hours = $diff->h + $diff->i / 60;
    if ($hours > $numWins) {
      return "";
    }

    $wins = array (99,0,0,0,0,0);
    for ($i = 0; $i < $numWins; $i++) {
      $wins[$prevWins[$i][0]]++;
    }
    $differentWins = 0;
    for ($i = 1; $i <= 5; $i++) {
      if ($wins[$i] > 0) {$differentWins++;}
    }

// Hurrah!
    $reply = " <strong>";
    switch ($differentWins) {
      case 3:
        $reply .= "Triple";
        break;
      case 4:
        $reply .= "Quadruple";
        break;
      case 5:
        $reply .= "Quintuple";
        break;
      default:
        return "";
        break;
    }
    return $reply . " Crown </strong>";
  }

  function logIn(string $user, string $password) {
    $sql = "SELECT * FROM Visitor WHERE Name = '" . $user . "';";
    $conn = openConnection ();
    $result = $conn->query($sql);
    if ($result->num_rows == 1) {
      $row = $result->fetch_assoc();
      if (password_verify($password, $row["Password"])){
        echo "login OK";
        $conn->close();
        return;
      }
    }
    echo "login failed";
    $conn->close();
  }

  function createUser(string $user, string $password) {
    // see https://www.php.net/manual/en/function.password-hash.php
    // and https://www.php.net/manual/en/function.password-verify.php
    // hash created is always different, but password_verify still matches
  // hash is 60 charachters: modified database

    $hash = getHash($password);
    if ($hash == ""){
      echo "hash error";
      return;
    }

    $sql = "SELECT * FROM Visitor WHERE Name = '" . $user . "';";
    $conn = openConnection ();
    $result = $conn->query($sql);
    if ($result->num_rows > 0) {
      echo "Name in use";
    } else {
      // add user and password # to database
      $sql = "INSERT INTO `Visitor` (`Name`, `Password`) VALUES ('" . $user . "', '" . $hash . "');";
      if ($conn->query($sql)) {
        echo "User added";
      } else {
        echo "Database Error";
      }
    }
    $conn->close();
  }

  function getHash (string $password) : string {
    // unable to ind out if the hash can contain '. So try again if it does.
    $tries = 10;
    $options = [ 'cost' => 10,];
    $hash = password_hash($password, PASSWORD_BCRYPT, $options);
    while (strpos($hash, "'")) {
      echo "<br>' in hash. Please tell george<br>";
      $hash = password_hash($password, PASSWORD_BCRYPT, $options);
      if ($tries-- < 0) {
        return "";
      }
    }
    return $hash;
  }

  function example ($password) {
  // different $hash2's were given at different times. All verify
    $options = [ 'cost' => 10,];
    $hash = password_hash("hash1", PASSWORD_BCRYPT, $options);
    $pwOK = password_verify("hash1", $hash);
    $hash2 = "\$2y\$10\$5IqlFSf2UAYV57eEg27IVeY2H8mp.1dTLG0VTgrPKFUEC0.CCX8wq";
    $pwOK = password_verify("hash1", $hash2);
    $hash2 = "\$2y\$10\$uVBDXTlqGMNHyJtZdHEEQuw6T3jdSjOpJ/0v2KZOFGPXjQyhHtgsq";
    $pwOK = password_verify("hash1", $hash2);
    $hash2 = "\$2y\$10\$WXJAd54whFOgZCFBlUQybeVMitRWcjhfcwdrBSsEjbpbh1PsWWx/W";
    $pwOK = password_verify("hash1", $hash2);

  }
?>
