/* eslint-disable import/no-extraneous-dependencies */
import Register from "@babel/register";
import path from "path";
import { register } from "ts-node";

register({
  project: path.resolve(".", "tsconfig.json"),
  require: ["tsconfig-paths/register"],
  transpileOnly: true,
  compilerOptions: { module: "nodenext" },
});

Register({
  extensions: [".ts", ".js"],
  rootMode: "upward",
});
