"use strict";

class UserZone {
  timeDiff = "";
  leagueTable;      // will be array containing league table 


  constructor() {
    const d = new Date();
    let diff = d.getTimezoneOffset();   // time difference between UTC time and local time in minutes. -60 in Berlin
    this.timeDiff = diff.toString(10);
  }

  initialise(clearMessage: boolean, refreshLeague?: boolean) {
    if (typeof (refreshLeague) == 'undefined') {
      refreshLeague = false;
    }
    const userName = document.getElementById("userName") as HTMLInputElement;
    const checkMe = document.getElementById("checkMe") as HTMLInputElement;
    userName.value = choices.user;
    userName.readOnly = true;
    document.getElementById("nameButton").innerText = "Change";
    document.getElementById("newUserButton").innerText = "New User";
    document.getElementById("closeButton").innerText = "Back to Game";
    document.getElementById("closeButton").hidden = false;
    document.getElementById("pwArea").hidden = true;
    document.getElementById("RememberMe").hidden = false;
    document.getElementById("pwAreaConfirm").hidden = true;
    if (choices.user == "unknown") {
      checkMe.checked = false;
    } else {
      checkMe.checked = !(choices.getCookie("user") == "");
    }
    document.getElementById("yesNoArea").hidden = true;
    if (clearMessage) {
      document.getElementById("result").innerText = "";
    }
    if (typeof (this.leagueTable) == 'undefined' || refreshLeague) {
      this.getLeague();
    }
  }

  getLeague() {
    let message = choices.user + "/League";
    let myThis = this;

    updateDB.xmlhttpDo(message, handleResponse);

    function handleResponse(response: string) {
      // get rows in response like
      // user_name/ 1/2/3/4/5/6/
      // where first number is total, second is AA score, then 7&6, SW, UR ,Ks
      // put into 2D array leagueTable where col 0 is the sort col, 1-7 are from response
      const chopped = response.split("/");
      let rows = chopped.length / 7 - 1;
      myThis.leagueTable = [];
      for (let row = 0; row < rows; row++) {
        myThis.leagueTable[row] = [];
        myThis.leagueTable[row][0] = "";
        for (let col = 1; col <= 7; col++) {
          myThis.leagueTable[row][col] = chopped[row * 7 + col - 1];
        }
      }
      myThis.showLeague(2);
    }

  }

  showLeague(sortCol: number) {
    document.getElementById("LeagueButtonArea").hidden = true;
    for (let row = 0; row < this.leagueTable.length; row++) {
      this.leagueTable[row][0] = this.leagueTable[row][sortCol];
    }
    if (sortCol == 1) {
      this.leagueTable.sort();
    } else {
      this.leagueTable.sort(sortNumeric);
      this.leagueTable.reverse();
    }
    this.showLeague2(sortCol);

    function sortNumeric(a: number[], b: number[]) {
      return a[0] - b[0];
    }

  }

  showLeague2(sortCol: number) {
    // output rows like
    // 1 user_name   1   2   3   4   5   6
    let rank = 1;
    let myHtml = '<table>';
    myHtml += '<tr><th colspan="8" align="center"><u>The League of Champions</u></th></tr>';
    myHtml += '<tr><th></th><th align="left">Player </th>';
    myHtml += '<th align="center">Overall </th>';
    myHtml += '<th align="center">Aunty<br>Allis</th>';
    myHtml += '<th align="center">Seven<br>&amp; six</th>';
    myHtml += '<th align="center">Senior<br>Wrangler</th>';
    myHtml += '<th align="center">Uncle<br>Remus</th>';
    myHtml += '<th align="center">Kings</th>';
    myHtml += '</tr>';

    myHtml += '<tr>';
    myHtml += '<td></td>';
    for (let col = 1; col <= 7; col++) {
      myHtml += this.showSortArrow(col, sortCol);
    }
    myHtml += '<tr>';


    for (let row = 0; row < this.leagueTable.length; row++) {
      let equalRank = "";
      if (row == 0) {
        rank = 1;
      } else {
        if (this.leagueTable[row][0] != this.leagueTable[row - 1][0]) {
          rank++;
        } else {
          equalRank = "=";
        }
      }
      myHtml += '<tr>';
      myHtml += '<td align="center">' + rank + equalRank + '</td>';
      // like
      // <td align="left"><a href="javascript:scoreUser1('Michael Keeling')">Michael Keeling</a></td>

      myHtml += '<td align="left"><a href="javascript:userZone.scoreUser1('
        + "'" + this.leagueTable[row][1] + "'" + ')">' + this.leagueTable[row][1] + '</a></td>';
      for (let col = 2; col <= 7; col++) {
        myHtml += '<td align="center">' + this.leagueTable[row][col] + '</td>';
      }
      myHtml += '</tr>';
    }
    myHtml += '</table>';
    document.getElementById("resultTable").innerHTML = myHtml;
  }

  showSortArrow(col: number, sortCol: number): string {
    let myHtml = '<td align="center"> <img src="img/';
    if (col == sortCol) {
      myHtml += 'downArrow';
    } else {
      myHtml += 'downArrowDis';
    }
    myHtml += '.png" onclick="userZone.showLeague(';
    myHtml += col;
    myHtml += ')" /></td>';
    return myHtml;
  }

  scoreUser1(user: string) {
    let message = user + "/ScoreUser/" + this.timeDiff;
    updateDB.xmlhttpDo(message, handleResponse);

    function handleResponse(response: string) {
      document.getElementById("LeagueButtonArea").hidden = false;
      if (response == "no results") {
        response += " for " + user;
      }
      document.getElementById("resultTable").innerHTML = response;
    }
  }

  changeUser() {
    const nameButton = document.getElementById("nameButton") as HTMLButtonElement;
    const userName = document.getElementById("userName") as HTMLInputElement;
    const pWord = document.getElementById("pWord") as HTMLInputElement;
    const pWordConfirm = document.getElementById("pWordConfirm") as HTMLInputElement;
    const forbiddenChars = "*/\\,'`´" + '"';
    switch (nameButton.innerText) {
      case "Change":
        // change user, log in will be next
        document.getElementById("pwArea").hidden = false;
        document.getElementById("RememberMe").hidden = true;
        nameButton.innerText = "Log in";
        userName.value = "";
        userName.readOnly = false;
        userName.focus();
        pWord.value = "";
        document.getElementById("newUserButton").innerText = "Cancel";
        document.getElementById("closeButton").hidden = true;
        break;
      case "Log in":
        // log in existing user
        if (!checkCharsOK(forbiddenChars, userName.value)) {
          nameError("Name may not contain charachters " + forbiddenChars);
          return;
        }
        updateDB.xmlhttpDo(userName.value + "/" + "LogIn/" + pWord.value, logInResponse);
        break;
      case "Create":
        // create new user
        if (!checkCharsOK(forbiddenChars, userName.value)) {
          nameError("Name may not contain charachters " + forbiddenChars);
          return;
        }

        userName.value = userName.value.trim();
        if (userName.value.search(/unknown/i) != -1) {
          nameError("Name may not contain 'unknown'");
          return;
        }
        if (userName.value.length < 4) {
          nameError("Four or more charachters in name please");
          return;
        }
        if (!checkCharsOK(forbiddenChars, pWord.value)) {
          nameError("Password may not contain charachters " + forbiddenChars);
          return;
        }
        if (pWord.value.length < 4) {
          nameError("Four or more charachters in password please");
          return;
        }
        if (pWord.value != pWordConfirm.value) {
          nameError("Passwords do not match");
          return;
        }
        updateDB.xmlhttpDo(userName.value + "/CreateUser/" + pWord.value, newUserResponse);
        break;
    }

    function checkCharsOK(badCharsStr: string, checkString: string): boolean {
      // cannot use search because of regular express
      const badChars = badCharsStr.split("");
      const checkChars = checkString.split("");
      for (let i = 0; i < badChars.length; i++) {
        for (let j = 0; j < checkChars.length; j++) {
          if (badChars[i] == checkChars[j]) { return false }
        }
      }
      return true;
    }

    function nameError(response) {
      const result = document.getElementById("result") as HTMLSpanElement;
      result.innerHTML = response;
    }

    function logInResponse(response) {
      const result = document.getElementById("result") as HTMLSpanElement;
      const userName = document.getElementById("userName") as HTMLInputElement;
      const checkMe = document.getElementById("checkMe") as HTMLInputElement;
      if (response == "login OK") {
        result.innerHTML = "Welcome back " + userName.value;
        choices.user = userName.value;
        if (checkMe.checked) {
          choices.updateCookie("user", choices.user)
        }
        if (selGame.gameState == GameState.Playing) {
          result.innerHTML += "<br>Current game will be credited to " + selGame.player; 
        }
        userZone.initialise(false);
        return;
      }
      result.innerHTML = response;
    }

    function newUserResponse(response) {
      const result = document.getElementById("result") as HTMLSpanElement;
      const userName = document.getElementById("userName") as HTMLInputElement;
      const checkMe = document.getElementById("checkMe") as HTMLInputElement;
      if (response == "User added") {
        result.innerHTML = "Welcome aboard " + userName.value + ", checking for previous games.";
        choices.user = userName.value;
        if (checkMe.checked) {
          choices.updateCookie("user", choices.user)
        }
        userZone.initialise(false);
        updateDB.xmlhttpDo(choices.user + "/ScoreIP/" + userZone.timeDiff, getScoresResponse);
        return;
      }
      result.innerHTML = response;
    }

    function getScoresResponse(response) {
      const result = document.getElementById("result") as HTMLSpanElement;
      if (response == "no results") {
        result.innerHTML = "Welcome aboard " + choices.user;
        userZone.initialise(false, true);
      }
      else {
        result.innerHTML = "Do you want to claim these results?"
        document.getElementById("yesNoArea").hidden = false;
        document.getElementById("resultTable").innerHTML = response;
      }
    }
  }

  no() {
    const result = document.getElementById("result") as HTMLSpanElement;
    result.innerHTML = "Welcome aboard " + choices.user;
    if (selGame.gameState == GameState.Playing) {
      result.innerHTML += "<br>Current game will be credited to " + selGame.player;
    }
    document.getElementById("yesNoArea").hidden = true;
    this.initialise(false, true);
}

  yes() {
    const result = document.getElementById("result") as HTMLSpanElement;
    result.innerHTML = "Transferring games. Please wait.";
    updateDB.xmlhttpDo(choices.user + "/Transfer", transferResponse);

    function transferResponse(response) {
      if (response != "Result: OK") {
        alert(response);
      }
      userZone.no();
    }
  }

  newUser() {
    const newUserButton = document.getElementById("newUserButton") as HTMLButtonElement;
    const nameButton = document.getElementById("nameButton") as HTMLButtonElement;
    const userName = document.getElementById("userName") as HTMLInputElement;
    const pWord = document.getElementById("pWord") as HTMLInputElement;
    const pWordConfirm = document.getElementById("pWordConfirm") as HTMLInputElement;
    switch (newUserButton.innerText) {
      case "New User":
        document.getElementById("pwArea").hidden = false;
        document.getElementById("RememberMe").hidden = true;
        document.getElementById("pwAreaConfirm").hidden = false;
        nameButton.innerText = "Create";
        document.getElementById("newUserButton").innerText = "Cancel";
        document.getElementById("closeButton").hidden = true;
        pWord.value = "";
        pWordConfirm.value = "";
        userName.value = "";
        userName.readOnly = false;
        userName.focus();
        document.getElementById("result").innerText = "";
        break;
      case "Cancel":
        this.initialise(true);
        break;
    }

  }

  close() {
    if (selGame.gameState == GameState.Welcome) {
      table.welcome();
    }
    toPage("mainPage")
  }

  eyeChange() {
    const eyeImage = document.getElementById("eyeImage") as HTMLImageElement;
    const pWord = document.getElementById("pWord") as HTMLInputElement;
    const pWordConfirm = document.getElementById("pWordConfirm") as HTMLInputElement;
    if (eyeImage.getAttribute("src") == "img/eyeOpen.png") {
      eyeImage.setAttribute("src", "img/eyeClosed.png");
      pWord.setAttribute("type", "password");
      pWordConfirm.setAttribute("type", "password");
    } else {
      eyeImage.setAttribute("src", "img/eyeOpen.png");
      pWord.setAttribute("type", "text");
      pWordConfirm.setAttribute("type", "text");
    }

  }

  saveMe() {
    const checkMe = document.getElementById("checkMe") as HTMLInputElement;
    if (choices.user == "unknown") {
      checkMe.checked = false;
    }
    if (checkMe.checked) {
      choices.updateCookie("user", choices.user)
    } else {
      choices.updateCookie("user", "")
    }
  }

}
