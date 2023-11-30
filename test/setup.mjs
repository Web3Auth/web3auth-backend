/* eslint-disable import/no-extraneous-dependencies */
import Register from "@babel/register";

Register({
  extensions: [".ts", ".js"],
  rootMode: "upward",
});
