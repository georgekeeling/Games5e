"use strict";
class UserTester {
    constructor() {
        this.gameElem = document.getElementById("selGame");
        this.nameElem = document.getElementById("fname");
        document.getElementById("result").innerHTML = "None";
        this.gameElem.value = "UncleRemus";
        this.nameElem.value = "John";
    }
    action(theAction, col1) {
        let message = this.nameElem.value + "/";
        if (typeof (col1) == 'undefined') {
            col1 = 0;
        }
        switch (theAction) {
            case "List":
            case "Time":
                message += theAction + "/";
                message += this.tzOffsetString;
                break;
            case "ListSort":
                message += theAction;
                message += "/" + col1.toString();
                message += "/" + this.tzOffsetString;
                break;
            case "Start":
            case "Won":
                message += "Post/" + this.gameElem.value + "/";
                message += theAction;
                break;
            default:
                document.getElementById("result").innerHTML = "Unknown!";
                return;
        }
        document.getElementById("result").innerHTML = "Message: " + message;
        this.updateDB.xmlhttpDo(message, handleResponse);
        function handleResponse(response) {
            document.getElementById("result").innerHTML =
                document.getElementById("result").innerHTML + " " + response;
        }
    }
    sort(column) {
        this.action("ListSort", column);
    }
    scoreUser() {
        this.scoreUser1(this.nameElem.value);
    }
    scoreUser1(user) {
        let message = user + "/ScoreUser/" + this.tzOffsetString;
        this.updateDB.xmlhttpDo(message, handleResponse);
        function handleResponse(response) {
            document.getElementById("result").innerHTML = response;
        }
    }
    starts10() {
        let users = ['Rob', 'Trev', 'George', 'Simon', 'David', 'Tom', 'Jim', 'Paul', 'Ruth', 'Siobhan'];
        let nameElem = document.getElementById("fname");
        for (let i = 0; i <= 9; i++) {
            nameElem.value = users[i];
            this.action('Start');
        }
    }
    initialise() {
        const d = new Date();
        this.siteWindow = new SiteWindow;
        this.updateDB = new UpdateDB;
        let diff = d.getTimezoneOffset(); // time difference between UTC time and local time in minutes. -60 in Berlin
        this.tzOffsetString = diff.toString(10);
    }
    getLeague() {
        let message = this.nameElem.value + "/League";
        let myThis = this;
        //let leagueTable = [
        //  ["12", 77, "fred"],
        //  ["5", 22, "john"],
        //  ["11", 5, "zom"]
        //];
        //leagueTable[3] = [];
        //leagueTable[3][0] = "1";
        //leagueTable[3][1] = 22;
        //leagueTable[3][2] = "George";
        //leagueTable.sort(sortNumeric);
        //leagueTable.reverse();
        this.updateDB.xmlhttpDo(message, handleResponse);
        function handleResponse(response) {
            // get rows like
            // user_name/ 1/2/3/4/5/6/
            // where first number is total, second is AA score, then 7&6, SW, UR ,Ks
            // put into 2D array where col 0 is the sort col, 1-7 are from response
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
    showLeague(sortCol) {
        for (let row = 0; row < this.leagueTable.length; row++) {
            this.leagueTable[row][0] = this.leagueTable[row][sortCol];
        }
        if (sortCol == 1) {
            this.leagueTable.sort();
        }
        else {
            this.leagueTable.sort(sortNumeric);
            this.leagueTable.reverse();
        }
        this.showLeague2(sortCol);
        function sortNumeric(a, b) {
            return a[0] - b[0];
        }
    }
    showLeague2(sortCol) {
        // output rows like
        // 1 user_name   1   2   3   4   5   6
        let myHtml = "<br>";
        myHtml += '<table>';
        myHtml += '<tr><th colspan="8" align="center">The League of Champions</th>';
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
            myHtml += '<tr>';
            myHtml += '<td align="center">' + (row + 1) + '</td>';
            // like
            // <td align="left"><a href="javascript:scoreUser1('Michael Keeling')">Michael Keeling</a></td>
            myHtml += '<td align="left"><a href="javascript:scoreUser1('
                + "'" + this.leagueTable[row][1] + "'" + ')">' + this.leagueTable[row][1] + '</a></td>';
            for (let col = 2; col <= 7; col++) {
                myHtml += '<td align="center">' + this.leagueTable[row][col] + '</td>';
            }
            myHtml += '</tr>';
        }
        myHtml += '</table>';
        document.getElementById("result").innerHTML = myHtml;
    }
    showSortArrow(col, sortCol) {
        let myHtml = '<td align="center"> <img src="img/';
        if (col == sortCol) {
            myHtml += 'downArrow';
        }
        else {
            myHtml += 'downArrowDis';
        }
        myHtml += '.png" onclick="showLeague(';
        myHtml += col;
        myHtml += ')" /></td>';
        return myHtml;
    }
    ScoreIP() {
        let message = this.nameElem.value + "/ScoreIP/" + this.tzOffsetString;
        this.updateDB.xmlhttpDo(message, handleResponse);
        function handleResponse(response) {
            document.getElementById("result").innerHTML = "<br>" + response;
        }
    }
}
//# sourceMappingURL=userTester.js.map