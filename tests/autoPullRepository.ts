import { autoPullRepository } from "../src";

autoPullRepository({
  username: "bibinocode",
  // https://gitee.com/profile/personal_access_tokens
  // https://github.com/settings/tokens
  token: "xxx",
  platform: 'gitee'
});
