import { useNavigate } from "react-router-dom";
import "../styles/LoginPage.css";
import { useSetRecoilState } from "recoil";
import { userSessionState } from "../recoil/atoms";
import { UserRole } from "../recoil/atoms";
import { IUser } from "../types/IUser";

// Used the following video for firebase authentication: https://www.youtube.com/watch?v=vDT7EnUpEoo
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// Import functions needed from appropriate SDKs
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../private/FirebaseAPI";

// using login email, determine if instructor by calling backend
function getRoleFromBackend(email: string): Promise<string> {
  return fetch(
    "https://cs0320-ci.cs.brown.edu:3333/isInstructor?email=" + email
  )
    .then((response) => response.json())
    .then((data) => {
      return data["message"]; // either student or instructor
    })
    .catch((error) => {
      console.log(
        "Error encountered when fetching role from backend: " + error
      );
    });
}

// checks if session started by determining if backend call to get info successful
export function checkSessionStarted(): Promise<boolean> {
  return fetch("https://cs0320-ci.cs.brown.edu:3333/getInfo")
    .then((response) => response.json())
    .then((data) => {
      if (data["result"] === "success") {
        return true;
      } else {
        // error with getting info means session not successful started
        return false;
      }
    })
    .catch((error) => {
      alert("ERROR " + error);
      return false;
    });
}

// checks already joined
export function checkAlreadyJoined(
  name: string,
  email: string
): Promise<UserRole> {
  // Check if they're a debugging partner already
  return fetch(
    "https://cs0320-ci.cs.brown.edu:3333/getInfo?name=" +
      name +
      "&email=" +
      email +
      "&role=" +
      "debuggingPartner"
  )
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      if (data["result"] === "success") {
        return UserRole.DebuggingPartner;
      } else {
        // Check if they're a help requester already
        return fetch(
          "https://cs0320-ci.cs.brown.edu:3333/getInfo?name=" +
            name +
            "&email=" +
            email +
            "&role=" +
            "helpRequester"
        )
          .then((response) => response.json())
          .then((data) => {
            if (data["result"] === "success") {
              return UserRole.HelpRequester;
            } else {
              return UserRole.NoneSelected;
            }
          });
      }
    })
    .catch((error) => {
      alert("ERROR " + error);
      return UserRole.NoneSelected;
    });
}

const LoginPage = () => {
  const navigate = useNavigate();
  const setUserSession = useSetRecoilState(userSessionState);

  // initialize Firebase login and redirect to appropriate page
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  const signInWithGoogle = async () => {
    try {
      // connects to google auth
      const result = await signInWithPopup(auth, provider);

      // retrieves email and name stored by google auth
      const name: string | null = result.user.displayName;
      const email: string | null = result.user.email;

      if (name == null || email == null) {
        return navigate("/failed-login");
      } else {
        // create IUser from email and name (role will be set later)
        let user: IUser = {
          email: email,
          name: name,
          role: "",
        };

        // // defensive programming
        // if (!user?.email.includes("brown.edu")) {
        //   return navigate("/failed-login");
        // }

        try {
          const roleFromBackend = await getRoleFromBackend(user.email);
          user.role = roleFromBackend;
        } catch (error) {
          console.error("Error fetching role from backend:", error);
          // Determine what to do with the error, handle it as needed
          return navigate("/failed-login");
        }
        if (user.role === "student") {
          // if a session has not been started, then create pop up
          checkSessionStarted()
            .then((isSessionStarted) => {
              if (!isSessionStarted) {
                return alert("No session has been started by an instructor.");
              } else {
                // First check to see if the student already has a role
                checkAlreadyJoined(user.name, user.email).then(
                  (role: UserRole) => {
                    if (
                      role == UserRole.DebuggingPartner ||
                      role == UserRole.HelpRequester
                    ) {
                      setUserSession({
                        user: user,
                        role: role,
                        time: new Date(),
                      });
                      return navigate("/dashboard");
                    } else {
                      // setting user session provides info for rest of frontend to use
                      setUserSession({
                        user: user,
                        role: UserRole.NoneSelected, // students still have to select role
                        time: null,
                      });
                      return navigate("/role-selection");
                    }
                  }
                );
              }
            })
            .catch((error) => {
              console.log("Error encountered: " + error);
            });
        } else if (user.role === "instructor") {
          checkSessionStarted()
            .then((isSessionStarted) => {
              // if session already started and instructor alert that cannot join
              // if (isSessionStarted) {
              //   return alert(
              //     "Only one session can be held at a time and an instructor has already started a session."
              //   );
              // } else {
              // setting user session provides info for rest of frontend to use
              setUserSession({
                user: user,
                role: UserRole.Instructor,
                time: null,
              });
              return navigate("/dashboard");
              //}
            })
            .catch((error) => {
              console.log("Error encountered: " + error);
            });
        }
      }
    } catch (error) {
      console.log("Error encountered during user authentication: " + error);
    }
  };

  // two different displays depending on if mocked mode
  return (
    <div className="login-body">
      <div className="login-container">
        <h1>Welcome to Collab Section</h1>
        <button onClick={signInWithGoogle} className="btn">
          Sign In With Google
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
