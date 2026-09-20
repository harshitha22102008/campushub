export type Club = {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;
  memberCount: number;
  eventCount: number;
  joined: boolean;
  role: "admin" | "member" | null;
  createdAt: string;
  updatedAt: string;
};

export type CampusEvent = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  location: string | null;
  clubId: string;
  clubName: string;
  createdById: string;
  joinCount: number;
  joined: boolean;
  createdAt: string;
  updatedAt: string;
};
