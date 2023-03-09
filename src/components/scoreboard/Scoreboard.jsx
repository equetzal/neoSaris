import React, { Component } from "react";
import FlipMove from "react-flip-move";
import TableRow from "./TableRow";
import Header from "./Header";
import "./Scoreboard.css";
var intervalPendingSubmission = null;

class Scoreboard extends Component {
  getSubmissions(submissionsData) {
    let submissionsOnContest = [];
    submissionsData.submissions.forEach(function (submission) {
      if (
        submission.timeSubmitted <
        submissionsData.contestMetadata.duration -
          submissionsData.contestMetadata.frozenTimeDuration
      ) {
        let result = {};
        result.contestantName = submission.contestantName;
        result.timeSubmitted = submission.timeSubmitted;
        result.verdict = submission.verdict;
        result.problemIndex = submission.problemIndex;
        result.problemScore = submission.problemScore;
        result.penalty = submission.penalty;
        submissionsOnContest.push(result);
      }
    });
    return submissionsOnContest;
  }

  getSubmissionsWhenFrozen(submissionsData) {
    let submissionsOnFrozen = [];
    submissionsData.submissions.forEach(function (submission) {
      if (
        submission.timeSubmitted >=
          submissionsData.contestMetadata.duration -
            submissionsData.contestMetadata.frozenTimeDuration &&
        submission.timeSubmitted <= submissionsData.contestMetadata.duration
      ) {
        let result = {};
        result.contestantName = submission.contestantName;
        result.timeSubmitted = submission.timeSubmitted;
        result.verdict = submission.verdict;
        result.problemIndex = submission.problemIndex;
        result.problemScore = submission.problemScore;
        result.penalty = submission.penalty;
        if (submissionsData.verdicts.wrongAnswerWithoutPenalty.includes(result.verdict) === false) {
          submissionsOnFrozen.push(result);
        }
      }
    });
    return submissionsOnFrozen;
  }

  resetTeams(teams) {
    for (let i = 0; i < teams.length; i++) {
      let currTeam = teams[i];
      currTeam.position = 0;
      currTeam.penalty = 0;
      currTeam.solved = 0;
      currTeam.totalScore = 0;
      for (let j = 0; j < this.state.numberOfProblems; j++) {
        currTeam.isProblemSolved[j] = 0;
        currTeam.isFirstToSolve[j] = 0;
        currTeam.triesOnProblems[j] = 0;
        currTeam.penaltyOnProblem[j] = 0;
        currTeam.problemScore[j] = 0;
      }
    }
    return teams;
  }

  resetSubmissions() {
    let teams = this.resetTeams(this.state.teams);
    this.setState({ teams: teams });
  }

  addSubmissionsTo(teams, submissions) {
    let problemHasBeenSolved = [];
    for (let i = 0; i < this.state.numberOfProblems; i++) {
      problemHasBeenSolved.push(0);
    }

    submissions.forEach(submission =>{
      if(submission.problemIndex === "D" && submission.contestantName === "ccup2018-18(E3)") console.log(submission)
      let currTeam = teams.filter(t => t.name === submission.contestantName)[0];
      let currProblem = this.props.submissionsData.problems.filter(p => p.index === submission.problemIndex)[0];
      let problemIndex = this.props.submissionsData.problems.indexOf(currProblem);
      //Wrong Answer without penalty
      if (this.props.submissionsData.verdicts.wrongAnswerWithoutPenalty.includes(submission.verdict)) {
        // continue;
      } else if (this.props.submissionsData.verdicts.accepted.includes(submission.verdict)) {
        // Updates best score
        if (currTeam.problemScore[problemIndex] < submission.problemScore){
          // substract previous score
          currTeam.totalScore -= currTeam.problemScore[problemIndex];
          // update score
          currTeam.problemScore[problemIndex] = submission.problemScore;
          currTeam.totalScore += submission.problemScore;


          // Adds penalty as omegaup says
          // gets extra penalty
          let extraPenalty = currTeam.triesOnProblems[problemIndex] * 10;
          currTeam.penalty -= currTeam.penaltyOnProblem[problemIndex];
          currTeam.penaltyOnProblem[problemIndex] = submission.penalty + extraPenalty;
          currTeam.penalty += submission.penalty + extraPenalty;
        }

        if(submission.verdict === "PA"){
        }
        else if(submission.verdict === "AC"){
          if(currTeam.isProblemSolved[problemIndex] === 0){
            if (problemHasBeenSolved[problemIndex] === 0) {
              problemHasBeenSolved[problemIndex] = 1;
              currTeam.isFirstToSolve[problemIndex] = 1;
            }
            currTeam.solved++;
            // Update accepted problem only if has not been accepted before.
            currTeam.isProblemSolved[problemIndex] = 1;
          }
        }

        currTeam.triesOnProblems[problemIndex]++;

      } else {
        // Update penalty problem only if has not been accepted before.
        currTeam.triesOnProblems[problemIndex]++;
      }
    })
    return teams;
  }

  sortTeams(teams) {
    let teamsSorted = teams.sort(function (a, b) {
      if(a.totalScore === b.totalScore){
        return b.penalty < a.penalty ? 1 : 0;
      }
      return a.totalScore < b.totalScore ? 1 : 0;
    });
    for (let i = 0; i < teamsSorted.length; i++) {
      teamsSorted[i].position = i+1;
    }
    return teamsSorted;
  }

  sortTeamsByStandingPosition() {
    let submissions = this.state.submissions;
    submissions = submissions.sort(function (a, b) {
      return a.timeSubmitted - b.timeSubmitted;
    });

    let submissionWhenFrozen = this.state.submissionWhenFrozen;
    submissionWhenFrozen = submissionWhenFrozen.sort(function (a, b) {
      return a.timeSubmitted - b.timeSubmitted;
    });

    this.setState({
      submissions: submissions,
      submissionWhenFrozen: submissionWhenFrozen,
    });
    let teamsSorted = this.sortTeams(this.state.teams);
    this.setState({ teams: teamsSorted });
  }

  addSubmissions() {
    let teams = this.addSubmissionsTo(this.state.teams, this.state.submissions);
    this.setState({ teams: teams });
  }

  updateScoreboard() {
    this.resetSubmissions();
    this.addSubmissions();
    this.sortTeamsByStandingPosition();
  }

  updatePositionOfStandings() {
    let lastPositionInStanding = {};
    for (let i = 0; i < this.state.teams.length; i++) {
      lastPositionInStanding[i] = this.state.teams[i].name;
    }
    this.setState({ lastPositionInStanding: lastPositionInStanding });
  }

  standingRemainsStatic() {
    for (let i = 0; i < this.state.teams.length; i++) {
      if (this.state.lastPositionInStanding[i] !== this.state.teams[i].name) {
        return false;
      }
    }
    return true;
  }

  componentDidMount() {
    this.updateScoreboard();
    this.updatePositionOfStandings();
    this.cleanSubmissions();
  }

  constructor(props) {
    super(props);
    let teams = props.submissionsData.contestants.map(contestant => {
      let triesOnProblems = [];
      let isProblemSolved = [];
      let penaltyOnProblem = [];
      let problemScore = [];
      let isFirstToSolve = [];
      for (let j = 0; j < props.submissionsData.problems.length; j++) {
        isProblemSolved.push(0);
        isFirstToSolve.push(0);
        triesOnProblems.push(0);
        penaltyOnProblem.push(0);
        problemScore.push(0);
      }

      let result = {};
      result.position = 0;
      result.name = contestant.name;
      result.id = contestant.id;
      result.penalty = 0;
      result.solved = 0;
      result.totalScore = 0;
      result.isProblemSolved = isProblemSolved;
      result.isFirstToSolve = isFirstToSolve;
      result.triesOnProblems = triesOnProblems;
      result.penaltyOnProblem = penaltyOnProblem;
      result.problemScore = problemScore;
      return result;
    });

    let submissions = this.getSubmissions(props.submissionsData);
    submissions = submissions.sort(function (a, b) {
      return a.timeSubmitted - b.timeSubmitted;
    });

    let submissionWhenFrozen = this.getSubmissionsWhenFrozen(props.submissionsData);
    submissionWhenFrozen = submissionWhenFrozen.sort(function (a, b) {
      return a.timeSubmitted - b.timeSubmitted;
    });

    let idOfNextUserRowHighlighted = -1;
    if (teams !== null && teams !== undefined) {
      idOfNextUserRowHighlighted = teams.length - 1;
    }

    this.state = {
      submissions: submissions,
      submissionWhenFrozen: submissionWhenFrozen,
      contestDuration: props.submissionsData.contestMetadata.duration,
      contestFrozenTime: props.submissionsData.contestMetadata.frozenTimeDuration,
      numberOfProblems: props.submissionsData.problems.length,
      teams: teams,
      verdictsWithoutPenalty: this.props.submissionsData.verdicts.wrongAnswerWithoutPenalty,
      currentFrozenSubmission: null,
      savedCurrentFrozenSubmission: null,
      savedCurrentFrozenSubmissionId: null,
      idOfNextUserRowHighlighted: idOfNextUserRowHighlighted,
      hasUserFinishedSubmissions: false,
      isPressedKeyOn: 0,
      hasNotBeenScrolled: false,
      contestantNameToSelect: null,
      standingHasChangedInLastOperation: false,
      lastPositionInStanding: {},
    };
  }

  getScoreboard() {
    return this.state.teams.map((team, i) => {
      let classNameForThisRow = "";
      if (this.state.isPressedKeyOn === 1 && this.state.idOfNextUserRowHighlighted === i) {
        if (this.state.hasUserFinishedSubmissions === true) {
          classNameForThisRow += " scoreboardTableSelectedRowFinished";
        } else {
          classNameForThisRow += " scoreboardTableSelectedRow";
        }
      } else if (
        this.state.isPressedKeyOn === 0 &&
        this.state.contestantNameToSelect === team.name
      ) {
        if (this.state.standingHasChangedInLastOperation === false) {
          classNameForThisRow += " scoreboardTableSelectedRowFinished";
        } else {
          classNameForThisRow += " scoreboardTableSelectedRow";
        }
      }
      return (
        <TableRow
          key={team.id}
          view={this.state.view}
          index={i}
          team={team}
          numberOfProblems={this.state.numberOfProblems}
          problems={this.props.submissionsData.problems}
          submissionWhenFrozen={this.state.submissionWhenFrozen}
          currentFrozenSubmission={this.state.savedCurrentFrozenSubmission}
          savedCurrentFrozenSubmission={this.state.currentFrozenSubmission}
          classNameForThisRow={classNameForThisRow}
        />
      );
    });
  }

  getProblemId(problemLetter) {
    let problemId = -1;
    for (let h = 0; h < this.state.numberOfProblems; h++) {
      if (this.props.submissionsData.problems[h].index === problemLetter) {
        problemId = h;
      }
    }
    return problemId;
  }

  cleanSubmissions() {
    let teams = this.state.teams;
    let submissionWhenFrozen = this.state.submissionWhenFrozen;
    let newSubmissionWhenFrozen = [];

    for (let i = 0; i < submissionWhenFrozen.length; i++) {
      let problemId = this.getProblemId(submissionWhenFrozen[i].problemIndex);
      if (problemId === -1) {
        continue;
      }
      for (let j = 0; j < teams.length; j++) {
        if (
          teams[j].name === submissionWhenFrozen[i].contestantName &&
          teams[j].isProblemSolved[problemId] === 0
        ) {
          newSubmissionWhenFrozen.push(submissionWhenFrozen[i]);
          break;
        }
      }
    }
    this.setState({ submissionWhenFrozen: newSubmissionWhenFrozen });
  }

  updateCurrenFrozenSubmission() {
    if (this.state.savedCurrentFrozenSubmission === null) {
      let currentFrozenSubmission = this.state.currentFrozenSubmission;
      this.setState({ savedCurrentFrozenSubmission: currentFrozenSubmission });
    } else {
      this.setState({ savedCurrentFrozenSubmission: null });
    }
  }

  nextSubmission(idOfNextUserRowHighlighted, submissionWhenFrozen, teams) {
    let submissionToRevealId = -1;
    for (let i = teams.length - 1; i >= 0 && submissionToRevealId === -1; i--) {
      for (let j = 0; j < submissionWhenFrozen.length; j++) {
        let problemId = this.getProblemId(submissionWhenFrozen[j].problemIndex);
        if (problemId === -1) {
          continue;
        }

        if (
          submissionWhenFrozen[j].contestantName === teams[i].name &&
          idOfNextUserRowHighlighted === i
        ) {
          submissionToRevealId = j;
          break;
        }
      }
    }
    return submissionToRevealId;
  }

  findNextSubmissionToReveal() {
    if (this.state.currentFrozenSubmission !== null) {
      let idToRemove = this.state.savedCurrentFrozenSubmissionId;
      let submissions = this.state.submissions;
      let submissionWhenFrozen = this.state.submissionWhenFrozen;

      if (idToRemove < submissionWhenFrozen.length) {
        submissions.push(submissionWhenFrozen[idToRemove]);
        submissionWhenFrozen.splice(idToRemove, 1);
      }

      this.setState({
        submissions: submissions,
        submissionWhenFrozen: submissionWhenFrozen,
        currentFrozenSubmission: null,
        savedCurrentFrozenSubmission: null,
        savedCurrentFrozenSubmissionId: null,
      });
      this.updateScoreboard();
      let idOfNextUserRowHighlighted = this.state.idOfNextUserRowHighlighted;

      if (
        this.nextSubmission(idOfNextUserRowHighlighted, submissionWhenFrozen, this.state.teams) ===
          -1 &&
        this.state.idOfNextUserRowHighlighted >= 0 &&
        this.standingRemainsStatic() === true
      ) {
        let contestantNameToSelect = this.state.teams[this.state.idOfNextUserRowHighlighted].name;
        this.setState({
          contestantNameToSelect: contestantNameToSelect,
          standingHasChangedInLastOperation: false,
        });
      } else if (
        this.state.idOfNextUserRowHighlighted >= 0 &&
        this.standingRemainsStatic() === false
      ) {
        let contestantNameToSelect =
          this.state.lastPositionInStanding[this.state.idOfNextUserRowHighlighted];
        this.updatePositionOfStandings();
        this.setState({
          contestantNameToSelect: contestantNameToSelect,
          standingHasChangedInLastOperation: true,
        });
      }

      clearInterval(intervalPendingSubmission);
      return;
    }

    if (this.state.hasUserFinishedSubmissions === true) {
      let idOfNextUserRowHighlighted = this.state.idOfNextUserRowHighlighted - 1;
      this.setState({
        hasUserFinishedSubmissions: false,
        idOfNextUserRowHighlighted: idOfNextUserRowHighlighted,
      });
      return;
    }

    this.cleanSubmissions();

    let submissionWhenFrozen = this.state.submissionWhenFrozen;
    let submissionToRevealId = this.nextSubmission(
      this.state.idOfNextUserRowHighlighted,
      submissionWhenFrozen,
      this.state.teams
    );

    if (submissionToRevealId !== -1) {
      this.setState({
        currentFrozenSubmission: submissionWhenFrozen[submissionToRevealId],
        savedCurrentFrozenSubmission: submissionWhenFrozen[submissionToRevealId],
        savedCurrentFrozenSubmissionId: submissionToRevealId,
      });
      intervalPendingSubmission = setInterval(() => this.updateCurrenFrozenSubmission(), 500);
    } else if (this.state.idOfNextUserRowHighlighted >= 0) {
      this.setState({ hasUserFinishedSubmissions: true });
    }
  }

  revealUntilTop(topTeams) {
    let teams = this.state.teams;
    let submissions = this.state.submissions;
    let submissionWhenFrozen = this.state.submissionWhenFrozen;
    let idOfNextUserRowHighlighted = this.state.idOfNextUserRowHighlighted;

    while (idOfNextUserRowHighlighted >= topTeams) {
      let idToRemove = this.nextSubmission(idOfNextUserRowHighlighted, submissionWhenFrozen, teams);
      if (idToRemove !== -1) {
        submissions.push(submissionWhenFrozen[idToRemove]);
        submissionWhenFrozen.splice(idToRemove, 1);
        teams = this.resetTeams(teams);
        teams = this.addSubmissionsTo(teams, submissions);
        teams = this.sortTeams(teams);
      } else if (idToRemove === -1) {
        idOfNextUserRowHighlighted--;
      }
    }

    this.updateScoreboard();
    this.updatePositionOfStandings();
    this.setState({
      submissions: submissions,
      submissionWhenFrozen: submissionWhenFrozen,
      currentFrozenSubmission: null,
      savedCurrentFrozenSubmission: null,
      savedCurrentFrozenSubmissionId: null,
      idOfNextUserRowHighlighted: idOfNextUserRowHighlighted,
      hasUserFinishedSubmissions: false,
      isPressedKeyOn: 0,
      hasNotBeenScrolled: false,
      contestantNameToSelect: null,
      standingHasChangedInLastOperation: false,
    });
  }

  keyDownHandler(e) {
    switch (e.keyCode) {
      case 78: //(N)ext Submission
        if (this.state.isPressedKeyOn === 0 && this.state.contestantNameToSelect !== null) {
          let idOfNextUserRowHighlighted = this.state.idOfNextUserRowHighlighted;
          if (this.state.standingHasChangedInLastOperation === false) {
            idOfNextUserRowHighlighted = Math.max(idOfNextUserRowHighlighted - 1, -1);
          }
          this.setState({
            contestantNameToSelect: null,
            standingHasChangedInLastOperation: false,
            idOfNextUserRowHighlighted: idOfNextUserRowHighlighted,
          });
        } else {
          this.findNextSubmissionToReveal();
          let isPressedKeyOn = 1 - this.state.isPressedKeyOn;
          this.setState({
            isPressedKeyOn: isPressedKeyOn,
            hasNotBeenScrolled: false,
          });
          this.scrollToElementSelected();
        }
        break;

      case 70: //(F)ast Submission
        //TODO: Implement Fast Submission, Reveal all pending solutions until AC or final WA
        console.log("(F)ast Submission, not implemented yet");
        break;

      case 84: //(T)op 10 Standing
        this.revealUntilTop(10);
        break;

      case 85: //(U)nfroze Standing
        this.revealUntilTop(0);
        break;

      case 65: //(A)utomatic Reveal
        //TODO: Implement automatic reveal, every X time reveal next submission
        console.log("(A)utomatic Reveal, not implemented yet");
        break;

      default:
        break;
    }
  }

  scrollToElementSelected() {
    if (
      this.state.isPressedKeyOn === 0 &&
      this.state.idOfNextUserRowHighlighted !== -1 &&
      this.state.hasNotBeenScrolled === false
    ) {
      let targetTeam = this.state.idOfNextUserRowHighlighted - 2;
      try {
        let id = this.state.teams[targetTeam].id;
        let element = document.getElementById(id);
        document.getElementById("score-FlipMove").scrollTo(0, element.offsetTop);
        this.setState({ hasNotBeenScrolled: true });
      } catch (e) {}
    }
  }

  render() {
    return (
      <div
        id="score"
        className={"scoreboardTable"}
        tabIndex="0"
        onKeyDown={e => this.keyDownHandler(e)}
      >
        <Header title={this.props.submissionsData.contestMetadata.name} />
        <div className="score-FlipMove" id="score-FlipMove">
          <FlipMove ref="flipMove" staggerDurationBy="10" duration={900}>
            {this.getScoreboard()}
          </FlipMove>
        </div>
      </div>
    );
  }
}

export default Scoreboard;
