import axios from "axios";
import fs, { writeFileSync } from "fs";
import path from "path";
import { exec } from "child_process";
import util from "util";
import dotenv from "dotenv";

// 加载.env文件
dotenv.config();

// 如果要支持并发（例如 N 个同时执行）
// 1. 用 execSync 会阻塞，换成异步的 exec（child_process 的 Promise 版本）。
// 2. 使用一个「并发控制器」限制最多 N 个任务同时进行（常见实现：队列、p-limit、手写 promise pool）。
// 3. 每个仓库的 pull/clone 操作作为一个 Promise，交给并发池调度。
const execAsync = util.promisify(exec);

interface RepoConfig {
  username: string;
  token?: string; // 改为可选
  platform: "github" | "gitee";
  cloneDir?: string;
  concurrency?: number; // 新增：并发数，默认 5
}

// 简单的并发池
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const currentIndex = index++;
      try {
        results[currentIndex] = await tasks[currentIndex]();
      } catch (err: any) {
        console.error(`Task ${currentIndex} failed: ${err.message}`);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

async function fetchAllRepos(apiUrl: string, headers: any): Promise<any[]> {
  let page = 1;
  const perPage = 100;
  let allRepos: any[] = [];

  while (true) {
    const url = `${apiUrl}?per_page=${perPage}&page=${page}`;
    const resp = await axios.get(url, { headers });
    const repos = resp.data;

    if (!repos || repos.length === 0) {
      break;
    }

    allRepos = allRepos.concat(repos);

    if (repos.length < perPage) {
      break; // 最后一页
    }
    page++;
  }

  return allRepos;
}


export async function autoPullRepository(config: RepoConfig): Promise<void> {
  const { username, token: tokenFromConfig, platform, cloneDir, concurrency = 5 } = config;

  // 优先使用配置中的token，如果没有则从.env文件读取
  const token = tokenFromConfig || process.env.GIT_TOKEN;
  if (!token) {
    throw new Error('Git token is required. Please provide it in config or set GIT_TOKEN in .env file');
  }

  const BASE_DIR = path.join(cloneDir || "cloned_repos", username);

  if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR, { recursive: true });
  }

  const PLATFORM_CONFIG = {
    github: {
      apiUrl: `https://api.github.com/users/${username}/repos`,
      authHeader: `token ${token}`,
      cloneUrl: (repo: string) =>
        `https://${username}:${token}@github.com/${username}/${repo}.git`,
    },
    gitee: {
      apiUrl: `https://gitee.com/api/v5/users/${username}/repos?access_token=${token}`,
      authHeader: "",
      cloneUrl: (repo: string) =>
        `https://${username}:${token}@gitee.com/${username}/${repo}.git`,
    },
  };

  const { apiUrl, authHeader, cloneUrl } = PLATFORM_CONFIG[platform];

  try {
    const repos = await fetchAllRepos(apiUrl, {
      "User-Agent": "Node.js",
      Accept: "application/vnd.github.v3+json",
      Authorization: authHeader,
    });

    writeFileSync('./repos.json', JSON.stringify(repos, null, 2))
    console.log(`\nFound ${repos.length} repositories on ${platform}`);
    console.log(`Cloning to: ${BASE_DIR}\n`);

    const tasks = repos.map((repo: any, index: number) => {
      const repoName = repo.name || repo.full_name.split("/")[1];
      const repoPath = path.join(BASE_DIR, repoName);
      const progress = `[${index + 1}/${repos.length}]`;

      return async () => {
        console.log(`${progress} Processing ${repoName}`);
        try {
          if (fs.existsSync(repoPath)) {
            console.log(`  ↳ Updating repository...`);
            await execAsync("git pull", { cwd: repoPath });
            console.log(`  ✓ Updated successfully\n`);
          } else {
            await execAsync(`git clone ${cloneUrl(repoName)} ${repoPath}`);
            console.log(`  ✓ Cloned successfully\n`);
          }
        } catch (error: any) {
          console.error(`  ✗ Error: ${error.message}\n`);
        }
      };
    });

    await runWithConcurrency(tasks, concurrency);
    console.log("All repositories processed!");
  } catch (error: any) {
    console.error(`Failed to fetch repositories: ${error.message}`);
  }
}
