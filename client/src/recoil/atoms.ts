import { atom } from "recoil";
import { IUser } from "../types/IUser";

// export const backend = "http://localhost:3333";
export const backend = "https://cs0320-ci.cs.brown.edu:3333";

export enum UserRole {
  Instructor = "instructor",
  DebuggingPartner = "debugging partner",
  HelpRequester = "help requester",
  NoneSelected = "",
}

export enum IssueType {
  Bug = "bug",
  ConceptualQuestion = "conceptual",
  NoneSelected = "",
}

export const userSessionState = atom({
  key: "userSessionState",
  default: {
    user: null as IUser | null,
    role: UserRole.NoneSelected,
    time: null as Date | null,
  },
});

export const singleSessionState = atom({
  key: "singleSessionState",
  default: { partner: null as IUser | null, issueType: IssueType.NoneSelected },
});

export const mockedMode = atom<boolean>({
  key: "mockedMode",
  default: false,
});
