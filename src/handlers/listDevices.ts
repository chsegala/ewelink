import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import "source-map-support/register";
import { getEwelinkAuthConnection } from "./utils/getEwelinkAuthConnection";
import { logger } from "./utils/configLogger"

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // All log statements are written to CloudWatch
  logger.debug("Received event:", event);

  const connection = await getEwelinkAuthConnection();

  const devices = await connection.getDevices();

  console.debug("Received event:", event);
  return {
    statusCode: 200,
    body: JSON.stringify(devices),
  };
};
