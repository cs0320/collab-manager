import { atom } from "recoil";
import { IUser } from "../types/IUser";

// export const backend = "http://localhost:3232";
export const backend = "https://cs0320-ci.cs.brown.edu:3232";

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

const localStorageEffect =
  (key: string) =>
  ({ setSelf, onSet }: any) => {
    const savedValue = localStorage.getItem(key);
    if (savedValue != null) {
      setSelf(JSON.parse(savedValue));
    }

    onSet((newValue: any) => {
      localStorage.setItem(key, JSON.stringify(newValue));
    });
  };

export const userSessionState = atom({
  key: "userSessionState",
  default: {
    user: null as IUser | null,
    role: UserRole.NoneSelected,
    time: null as Date | null,
  },
  effects_UNSTABLE: [localStorageEffect("userSession")],
});

export const singleSessionState = atom({
  key: "singleSessionState",
  default: { partner: null as IUser | null, issueType: IssueType.NoneSelected },
});

export const mockedMode = atom<boolean>({
  key: "mockedMode",
  default: false,
});
