export type TUserRole = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type TUserStatus = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type TUser = {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  description?: string;
  role: TUserRole;
  roleId: number;
  status: TUserStatus;
  statusId: number;
  createdAt: string;
  updatedAt: string;
};
