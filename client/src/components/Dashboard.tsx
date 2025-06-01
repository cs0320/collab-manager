import React, { useEffect, useState } from "react";
import { useUser, SignedIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import {
  IssueType,
  UserRole,
  backend,
  mockedMode,
} from "../recoil/atoms";
import "../styles/Dashboard.css";
import Timer from "./Timer";
import "../styles/nightsky.scss";
import { IUser } from "../types/IUser";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

const Dashboard = () => {
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();

  // Clerk user info
  const userRole = user?.publicMetadata.role as UserRole;
  const userName = user?.firstName || user?.fullName || "";
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";

  // Local state for session info
  const [singleSession, setSingleSession] = useState({
    partner: null as IUser | null,
    issueType: IssueType.NoneSelected,
  });
  const [bugCategory, setBugCategory] = useState("");
  const [debuggingProcess, setDebuggingProcess] = useState("");
  const [fullTimeRemaining, setFullTimeRemaining] = useState(0);
  const [pairedTime, setPairedTime] = useState(0);
  const [escalationTimeRemaining, setEscalationTimeRemaining] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Instructor state
  const [unpairedDP, setUnpairedDP] = useState<any[]>([]);
  const [unpairedHR, setUnpairedHR] = useState<any[]>([]);
  const [escalatedPairs, setEscalatedPairs] = useState<any[]>([]);
  const [nonEscalatedPairs, setNonEscalatedPairs] = useState<any[]>([]);

  const [escalationResult, setEscalationResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convex queries
  const info = useQuery(api.getInfo.getInfo);
  const removeFromQueueMutation = useMutation(api.removeFromQueue.removeFromQueue);
  const escalateMutation = useMutation(api.escalate.escalate);
  const startSessionMutation = useMutation(api.session.startSession);
  const endSessionMutation = useMutation(api.session.endSession);

  // Redirect to login if not signed in
  useEffect(() => {
    if (!isSignedIn) {
      navigate("/login");
    }
  }, [isSignedIn, navigate]);

  // Session start/end logic (Instructor)
  useEffect(() => {
    if (userRole !== UserRole.Instructor) return;
    if (info) {
      // Compute unpaired debugging partners
    setUnpairedDP(
      info.debuggingPartners.filter((dp: any) => !dp.pairAtTime)
    );
    // Compute unpaired help requesters
    setUnpairedHR(
      info.helpRequesters.filter((hr: any) => !hr.pairAtTime)
    );
    // Compute escalated pairs (example: filter helpRequesters with escalated flag)
    setEscalatedPairs(
      info.helpRequesters.filter((hr: any) => hr.escalated)
    );
    // Compute non-escalated pairs
    setNonEscalatedPairs(
      info.helpRequesters.filter((hr: any) => !hr.escalated)
    );
    }
  }, [userRole, info]);

  // DebuggingPartner/HelpRequester: fetch pairing info
  useEffect(() => {
    if (
      userRole !== UserRole.DebuggingPartner &&
      userRole !== UserRole.HelpRequester
    )
      return;
    if (info) {
      let userData;
      if (userRole === UserRole.DebuggingPartner) {
        userData = info.debuggingPartners.find(
          (u: any) => u.email === userEmail
        );
      } else if (userRole === UserRole.HelpRequester) {
        userData = info.helpRequesters.find(
          (u: any) => u.email === userEmail
        );
      }

      if (userData && userData.name) {
        setSingleSession({
          partner: { ...userData, role: userRole },
          issueType:
            userRole === UserRole.HelpRequester && "bugType" in userData
              ? (IssueType[userData.bugType as keyof typeof IssueType] ?? IssueType.NoneSelected)
              : IssueType.NoneSelected,
        });
      } else {
        setSingleSession({ partner: null, issueType: IssueType.NoneSelected });
      }

      if (
        userData &&
        userRole === UserRole.DebuggingPartner &&
        "flagged" in userData &&
        userData.flagged
      ) {
        alert("You have been flagged!");
      }
      if (userRole === UserRole.HelpRequester) {
        if (userData && 'escalated' in userData && userData.escalated) {
          // Now TypeScript knows userData is a helpRequester
          setEscalationResult("You have been escalated");
        }
      }
    }
  }, [userRole, userEmail, info]);

  // Timer for full session (1 hour)
  function calculateFullTimeRemaining() {
    if (!pairedTime) return 0;
    const oneHourInMillis = 60 * 60 * 1000;
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - pairedTime;
    const remainingTime = Math.max(oneHourInMillis - elapsedTime, 0);
    return remainingTime;
  }

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setFullTimeRemaining(calculateFullTimeRemaining());
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [pairedTime]);

  // Timer for escalation (15 minutes)
  function calculateTimeBeforeEscalation() {
    if (!pairedTime) return 0;
    const fifteenMinsInMillis = 15 * 60 * 1000;
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - pairedTime;
    const remainingTime = Math.max(fifteenMinsInMillis - elapsedTime, 0);
    return remainingTime;
  }

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setEscalationTimeRemaining(calculateTimeBeforeEscalation());
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [pairedTime]);

  // Remove from queue
  const removeFromQueue = async () => {
    if (!userEmail || !userRole) return;
    await removeFromQueueMutation({ email: userEmail, role: userRole });
    // Optionally, reset state here
  };

  // Form submit handler
  const handleFormSubmit = async () => {
    if (bugCategory === "" || debuggingProcess === "") {
      return alert("Bug category and debugging process inputs required!");
    }
    if (!singleSession.partner) {
      alert(
        "You cannot submit this form until you have been matched with a help requester"
      );
      return;
    }
    try {
      if (mockedMode) {
        const response = await fetch("http://localhost:2000/submitForm/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              user: userEmail,
              partner: singleSession.partner.email,
              bugCategory: bugCategory,
              debuggingProcess: debuggingProcess,
            },
          }),
        });
        if (!response.ok) {
          throw new Error("Server error: " + response.status);
        } else {
          const result = await response.json();
          if (result.success) {
            setSingleSession({
              partner: null,
              issueType: IssueType.NoneSelected,
            });
            setBugCategory("");
            setDebuggingProcess("");
          } else {
            alert("Form submission failed:" + result);
          }
        }
      } else {
        const response = await fetch(
          backend +
            "/submitDebuggingQuestions?debuggingPartnerName=" +
            encodeURIComponent(userName) +
            "&debuggingPartnerEmail=" +
            encodeURIComponent(userEmail) +
            "&helpRequesterName=" +
            encodeURIComponent(singleSession.partner.name) +
            "&helpRequesterEmail=" +
            encodeURIComponent(singleSession.partner.email) +
            "&bugCategory=" +
            encodeURIComponent(bugCategory) +
            "&debuggingProcess=" +
            encodeURIComponent(debuggingProcess)
        );
        const data = await response.json();
        if (data.result === "success") {
          setBugCategory("");
          setDebuggingProcess("");
        }
      }
    } catch (error) {
      console.log("Error encountered during form submission: " + error);
    }
  };

  // Escalate handler
  const handleEscalate = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await escalateMutation({ helpRequesterEmail: singleSession.partner?.email || "" });
      setEscalationResult("Escalation Success");
    } catch (error) {
      setEscalationResult("Escalation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Session start/end handlers (for instructors)
  const handleStart = async () => {
    try {
      await startSessionMutation();
      setSessionStarted(true);
    } catch (error) {
      console.log("Error encountered during session start: " + error);
    }
  };

  const handleEnd = async () => {
    try {
      await endSessionMutation();
      setSessionStarted(false);
    } catch (error) {
      console.log("Error encountered during session end: " + error);
    }
  };

  // Download all data (for instructors)
  const handleDownloadAll = async () => {
    await fetch(backend + "/downloadInfo?type=all", {
      method: "GET",
    })
      .then((response) => {
        if (!response.ok) {
          alert("HTTP error! Status: " + response.status);
        }
        const filenameHeader = response.headers.get("Content-Disposition");
        const filename = filenameHeader
          ? filenameHeader.split("=")[1]
          : "all-attendance.csv";
        return response.blob().then((blob) => ({ blob, filename }));
      })
      .then(({ blob, filename }) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((error) => {
        console.log("Error encountered during data download: " + error);
      });
  };

  // Remove debugging partner from attendance (for instructors)
  const handleRemove = (name: string, email: string) => async () => {
    return fetch(
      backend +
        "/debuggingPartnerDone?name=" +
        encodeURIComponent(name) +
        "&email=" +
        encodeURIComponent(email) +
        "&record=no"
    )
      .then((response) => response.json())
      .then((data) => {
        return data["message"];
      })
      .catch((error) => {
        console.log(
          "Error encountered during debugging partner removal: " + error
        );
      });
  };

  // Deescalate a pair (for instructors)
  const deescalate = (HRname: string, HRemail: string) => async () => {
    return fetch(
      backend +
        "/deescalate?helpRequesterName=" +
        encodeURIComponent(HRname) +
        "&helpRequesterEmail=" +
        encodeURIComponent(HRemail)
    )
      .then((response) => response.json())
      .then((data) => {
        return data["message"];
      })
      .catch((error) => {
        console.log("Error encountered during rematching: " + error);
      });
  };

  // Rematch and flag (for instructors)
  const handleRematchFlag =
    (HRname: string, HRemail: string, DPname: string, DPemail: string) =>
    async () => {
      return fetch(
        backend +
          "/flagAndRematch?helpRequesterName=" +
          encodeURIComponent(HRname) +
          "&helpRequesterEmail=" +
          encodeURIComponent(HRemail) +
          "&debuggingPartnerName=" +
          encodeURIComponent(DPname) +
          "&debuggingPartnerEmail=" +
          encodeURIComponent(DPemail)
      )
        .then((response) => response.json())
        .then((data) => {
          return data["message"];
        })
        .catch((error) => {
          console.log("Error encountered during rematching: " + error);
        });
    };

  // Open resources website
  const openResourcesWebsite = () => {
    const url: string = "https://hackmd.io/@brown-csci0320/BJKCtyxxs/";
    window.open(url, "_blank");
  };

  // Render header based on role
  const renderHeaderBasedOnRole = (role: UserRole) => {
    switch (role) {
      case UserRole.Instructor:
        return (
          <header className="instructor-header">
            <button className="download-button" onClick={handleDownloadAll}>
              Download All Data
            </button>
            {!sessionStarted ? (
              <button className="start-button" onClick={handleStart}>
                Start Session
              </button>
            ) : (
              <button
                className="end-button"
                disabled={isSubmitting}
                onClick={handleEnd}
              >
                End Session
              </button>
            )}
          </header>
        );
      case UserRole.DebuggingPartner:
        return (
          <header className="user-header">
            <p className="join-time">
              Join time:{" "}
              {singleSession.partner ? new Date().toLocaleTimeString() : ""}
            </p>
            {renderTimerOrButton()}
          </header>
        );
      case UserRole.HelpRequester:
        return (
          <header className="user-header" style={{ marginBottom: 170 }}>
            <p className="join-time">
              Join time:{" "}
              {singleSession.partner ? new Date().toLocaleTimeString() : ""}
            </p>
            <button className="done-button" onClick={removeFromQueue}>
              I'm done!
            </button>
          </header>
        );
      default:
        return null;
    }
  };

  // Render timer or done button for DebuggingPartner
  const renderTimerOrButton = () => {
    if (fullTimeRemaining > 0) {
      return <Timer fullTimeRemaining={fullTimeRemaining} />;
    } else if (fullTimeRemaining === 0) {
      return (
        <div>
          <button className="done-button" onClick={removeFromQueue}>
            I'm done with my FULL hour!
          </button>
        </div>
      );
    }
  };

  // Render escalate timer or button for DebuggingPartner
  const renderEscalateTimerOrButton = () => {
    if (!singleSession.partner) {
      return "Single session hasn't started!";
    } else if (escalationTimeRemaining > 0) {
      return <Timer fullTimeRemaining={escalationTimeRemaining} />;
    } else if (escalationTimeRemaining === 0) {
      return (
        <div>
          <button
            className="escalate-button"
            disabled={isSubmitting}
            onClick={handleEscalate}
          >
            Escalate!
          </button>
          {escalationResult && <p>{escalationResult}</p>}
        </div>
      );
    }
  };

  // Instructor content
  const renderInstructorContent = () => (
    <div className="instructor-container">
      <div className="unpaired-students-container">
        <div className="general-title">
          <b>Debugging Partners:</b>
        </div>
        <div className="list-debugging" style={{ height: "95px" }}>
          {unpairedDP && unpairedDP.length > 0 ? (
            unpairedDP.map((partner, index) => (
              <div key={index} className="single-debugging">
                <div className="single-debugging-namentime">
                  <p className="name">
                    {index + 1}. {partner[0]}
                  </p>
                  <p className="time">Joined at {partner[2]}</p>
                </div>
                <button onClick={handleRemove(partner[0], partner[1])}>
                  Remove
                </button>
              </div>
            ))
          ) : (
            <div
              style={{
                marginBottom: "10px",
                color: "darkred",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              None available!
            </div>
          )}
        </div>
        <div className="general-title">
          <b>Help Requesters:</b>
        </div>
        <div className="list-debugging">
          {unpairedHR && unpairedHR.length > 0 ? (
            unpairedHR.map((partner, index) => (
              <div key={index} className="single-debugging">
                <div className="single-debugging-namentime">
                  <p className="name">
                    {index + 1}. {partner[0]}
                  </p>
                  <p className="time">Joined at {partner[2]}</p>
                </div>
                <button onClick={handleRemove(partner[0], partner[1])}>
                  Remove
                </button>
              </div>
            ))
          ) : (
            <div
              style={{
                marginBottom: "10px",
                color: "darkred",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              None in queue!
            </div>
          )}
        </div>
      </div>
      <div className="paired-students-container">
        <div className="general-title">
          <b>Escalated Pairs:</b>
        </div>
        <div className="list-debugging" style={{ height: "95px" }}>
          {escalatedPairs && escalatedPairs.length > 0 ? (
            escalatedPairs.map((pair, index) => (
              <div key={index} className="single-debugging">
                <div className="single-debugging-namentime">
                  <p className="name">
                    {index + 1}. DP: {pair[0][0]} & HR: {pair[1][0]}
                  </p>
                  <p className="time">Matched at {pair[2][0]}</p>
                </div>
                <button onClick={deescalate(pair[1][0], pair[1][1])}>
                  De-escalate
                </button>
              </div>
            ))
          ) : (
            <div
              style={{
                color: "darkred",
                display: "flex",
                justifyContent: "center",
              }}
            >
              None yet!
            </div>
          )}
        </div>
        <div className="general-title">
          <b>Non-Escalated Pairs:</b>
        </div>
        <div className="list-debugging">
          {nonEscalatedPairs && nonEscalatedPairs.length > 0 ? (
            nonEscalatedPairs.map((pair, index) => (
              <div key={index} className="single-debugging">
                <div className="single-debugging-namentime">
                  <p className="name">
                    {index + 1}. DP: {pair[0][0]} & HR: {pair[1][0]}
                  </p>
                  <p className="time">Matched at {pair[2][0]}</p>
                </div>
                <button
                  onClick={handleRematchFlag(
                    pair[1][0],
                    pair[1][1],
                    pair[0][0],
                    pair[0][1]
                  )}
                >
                  Remove DP
                </button>
                <button onClick={handleRemove(pair[1][0], pair[1][1])}>
                  Remove HR
                </button>
              </div>
            ))
          ) : (
            <div
              style={{
                marginBottom: "10px",
                color: "darkred",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              None yet!
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render content based on role
  const renderContentBasedOnRole = (role: UserRole) => {
    switch (role) {
      case UserRole.Instructor:
        return renderInstructorContent();
      case UserRole.DebuggingPartner:
        return (
          <div className="debugging-partner-content">
            <div className="other-partner-info">
              <p>
                Your help requester is:{" "}
                <b>
                  {singleSession.partner
                    ? singleSession.partner.name
                    : "No one yet!"}
                </b>
              </p>
              {singleSession.partner && (
                <p>
                  Issue category: <b>{singleSession.issueType}</b>
                </p>
              )}
            </div>
            <div className="debugging-form">
              <div className="bug-category">
                <p>
                  <b>Bug category: </b>
                </p>
                <input
                  type="bugCategory"
                  placeholder="NullPointerException"
                  value={bugCategory}
                  onChange={(e) => setBugCategory(e.target.value)}
                />
              </div>
              <div className="debugging-process">
                <p>
                  <b>Debugging process: </b>
                </p>
                <input
                  type="debuggingProcess"
                  placeholder="Strategically placed print statements to trace the bug source, then..."
                  value={debuggingProcess}
                  onChange={(e) => setDebuggingProcess(e.target.value)}
                />
              </div>
              <button className="submit-button" onClick={handleFormSubmit}>
                Submit!
              </button>
            </div>
            <div className="escalate-container">
              <b>
                Once 15 minutes in a current session have passed, you may
                escalate:
              </b>
              {renderEscalateTimerOrButton()}
            </div>
          </div>
        );
      case UserRole.HelpRequester:
        return (
          <div
            className="debugging-partner-content"
            style={{ marginBottom: 20 }}
          >
            <div className="other-partner-info">
              <p>
                Your debugging partner is:{" "}
                <b>
                  {singleSession.partner
                    ? singleSession.partner.name
                    : "No one yet!"}
                </b>
              </p>
            </div>
            <div className="escalation-content">
              {escalationResult && <p>{escalationResult}</p>}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Main render
  
  if (!isSignedIn) {
    // Optionally, you can redirect or just return null/empty
    return null;
  }
  return (
    
      <div className="body">
        <div id="stars-container">
          <div id="stars"></div>
          <div id="stars2"></div>
          <div id="stars3"></div>
        </div>
        <div className="dashboard-body">
          {renderHeaderBasedOnRole(userRole)}
          <div className="dashboard-container">
            <div className="welcome-container">
              <h1>Welcome, {user?.firstName || "User"}!</h1>
              <button className="tooltip">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="tooltip-icon"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  onClick={openResourcesWebsite}
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span className="tooltiptext">Debugging Recipe</span>
              </button>
            </div>
            {renderContentBasedOnRole(userRole)}
          </div>
        </div>
      </div>
  );
};

export default Dashboard;