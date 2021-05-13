import eWelink from "ewelink-api";
import { LoginResult } from "./loginResult";
import { parseLambdaBlob, remoteLambdaCall } from "./remoteLambdaCall";


const getConnection = (ret: LoginResult) => {
  const auth = { at: ret.accessToken };
  return new eWelink(auth);
}

export const getEwelinkAuthConnection = async (): Promise<eWelink> => {
  const ret = await remoteLambdaCall(process.env["GET_LOGIN_FUNCTION"] ?? "");
  const auth = await parseLambdaBlob(ret) as LoginResult;

  return getConnection(auth);
};