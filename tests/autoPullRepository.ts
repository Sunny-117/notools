import { autoPullRepository } from "../src";

autoPullRepository({
  username: "Sunny-117",
  // https://gitee.com/profile/personal_access_tokens
  // https://github.com/settings/tokens
  token: "123",
  platform: 'github',
  cloneDir: '/Users/olive/Desktop/github',
  concurrency: 30
});
