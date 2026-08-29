// @ts-check
import { module } from "@prisma/composer";
import llmArenaService from "./service.mjs";

export default module("llm-arena", ({ provision }) => {
  provision(llmArenaService, { id: "llmarena" });
});
