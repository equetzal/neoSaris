import React from "react";
import "./ProblemBox.css";

// problemStatus = "FirstAccepted" | "Accepted" | "Resolving" | "Pending" | "WrongAnswer" | "NoAttempted"

const ProblemBox = ({ index, width, problemStatus, displayText }) => {
  return (
    <span className={`problemBox problemBox-${problemStatus} center p0 m0`} style={{ width }} key={index}>
      {displayText[0]}
      {displayText.length>1 && <><br/>{displayText[1]}</>}
      {displayText.length>2 && <><br/>{displayText[2]}</>}
    </span>
  );
};

export default ProblemBox;
