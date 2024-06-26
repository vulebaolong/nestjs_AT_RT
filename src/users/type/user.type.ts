export type TUser = {
  id: number;
  name: string;
  email: string;
  password: string;
  refreshToken: string;
};

export type TUserPayloadToken = {
  sub: number;
  email: string;
  iat: number;
  exp: number;
};
