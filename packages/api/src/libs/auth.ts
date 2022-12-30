import jwt from "jsonwebtoken";
import { APIGatewayProxyEvent } from "aws-lambda";
import { createHttpError } from "./httpErrors";
import { getParameterValue } from "./ssm";

const isAuthorized = async (authorization?: string) => {
  try {
    if (!authorization) throw new Error("Looks like authorization is empty");

    const token = authorization.replace("Bearer ", "");

    const privateKey = await getParameterValue({
      Name: `jwt-private-key`,
      WithDecryption: true,
    });

    if (!privateKey) {
      console.error(`Unable to retrieve private key`);
      throw createHttpError(401);
    }

    return jwt.verify(token, privateKey, { algorithms: ["RS256"] }) as Token;
  } catch (e) {
    throw createHttpError(401);
  }
};

// export const createAuthenticator = ({ privateKey }: { privateKey: string }) => ({
//   withToken: _withToken(privateKey)
// })

// const authenticator = createAuthenticator({ privateKey: JWT_PRIVATE_KEY })

export type Token = {
  userId: string;
  email: string;
  sub: string;
  "_couchdb.roles"?: string[];
};

export const createRefreshToken = (name: string) => {
  return generateToken(name, "1d");
};

export const generateToken = async (email: string, userId: string) => {
  const tokenData: Token = {
    email,
    userId,
    sub: email,
    "_couchdb.roles": [email],
  };

  return jwt.sign(
    tokenData,
    (await getParameterValue({
      Name: `jwt-private-key`,
      WithDecryption: true,
    })) ?? ``,
    { algorithm: "RS256" }
  );
};

// https://docs.couchdb.org/en/3.2.0/config/couch-peruser.html#couch_peruser
export const generateAdminToken = async (options: { sub?: string } = {}) => {
  const data: Token = {
    email: "",
    userId: "",
    sub: "admin",
    "_couchdb.roles": ["_admin"],
    ...options,
  };

  return jwt.sign(
    data,
    (await getParameterValue({
      Name: `jwt-private-key`,
      WithDecryption: true,
    })) ?? ``,
    { algorithm: "RS256" }
  );
};

export const withToken = async (
  event: Pick<APIGatewayProxyEvent, `headers`>
) => {
  const authorization =
    (event.headers.Authorization as string | undefined) ||
    (event.headers.authorization as string | undefined);

  return await isAuthorized(authorization);
};

// const createRefreshToken = (name: string, authSession: string) => {
//   return generateToken(name, '1d')
// }

// const generateToken = async (email: string, userId: string, expiresIn: string = '1d') => {
//   const tokenData: Token = { email, userId }

//   return jwt.sign(tokenData, JWT_PRIVATE_KEY, { algorithm: 'RS256' })
// }
