import serverless from "serverless-http";
import { app, loadData } from "../../server.ts";

loadData();

export const handler = serverless(app);
