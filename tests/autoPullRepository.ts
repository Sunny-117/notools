import { autoPullRepository } from "../src";

autoPullRepository({
  username: "Sunny-117",
  platform: 'github',
  cloneDir: '/Users/olive/Desktop/github',
  concurrency: 30
});
