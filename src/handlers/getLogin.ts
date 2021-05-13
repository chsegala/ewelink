import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import eWelink from "ewelink-api";
import { LoginResult } from "./utils/loginResult";

let credentials: any;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // All log statements are written to CloudWatch
  console.debug("Received event:", event);

  if (!credentials) {

    const username = process.env['USERNAME']!.toString();
    const password = process.env['PASSWORD']!.toString();

    const connection = new eWelink({
      email: username,
      password: password,
    });

    //@ts-ignore
    credentials = await connection.getCredentials();
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      accessToken: credentials.at,
      apiKey: credentials.user.apikey,
      region: credentials.region,
    } as LoginResult),
  };
}