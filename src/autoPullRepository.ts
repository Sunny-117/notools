import axios from "axios";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

interface RepoConfig {
  username: string;
  token: string;
  platform: "github" | "gitee";
  cloneDir?: string;
}

export function autoPullRepository(config: RepoConfig): void {
  const { username, token, platform, cloneDir } = config;
  const BASE_DIR = path.join(process.cwd(), cloneDir || "cloned_repos", username);
  
  // 创建基础目录
  if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR, { recursive: true });
  }

  // 配置平台参数
  const PLATFORM_CONFIG = {
    github: {
      apiUrl: `https://api.github.com/users/${username}/repos`,
      authHeader: `token ${token}`,
      cloneUrl: (repo: string) => `https://${username}:${token}@github.com/${username}/${repo}.git`
    },
    gitee: {
      apiUrl: `https://gitee.com/api/v5/users/${username}/repos?access_token=${token}`,
      authHeader: "",
      cloneUrl: (repo: string) => `https://${username}:${token}@gitee.com/${username}/${repo}.git`
    }
  };

  const { apiUrl, authHeader, cloneUrl } = PLATFORM_CONFIG[platform];

  // 获取仓库列表
  axios({
    method: "get",
    url: apiUrl,
    headers: {
      "User-Agent": "Node.js",
      "Accept": "application/vnd.github.v3+json",
      "Authorization": authHeader
    }
  })
  .then(response => {
    const repos = response.data;
    console.log(`\nFound ${repos.length} repositories on ${platform}`);
    console.log(`Cloning to: ${BASE_DIR}\n`);

    // 带进度条的克隆流程
    repos.forEach((repo: any, index: number) => {
      const repoName = repo.name || repo.full_name.split('/')[1];
      const repoPath = path.join(BASE_DIR, repoName);
      const progress = `[${index + 1}/${repos.length}]`;

      try {
        console.log(`${progress} Processing ${repoName}`);
        
        if (fs.existsSync(repoPath)) {
          console.log(`  ↳ Updating repository...`);
          execSync("git pull", { cwd: repoPath });
          console.log(`  ✓ Updated successfully\n`);
        } else {
          execSync(`git clone ${cloneUrl(repoName)} ${repoPath}`);
          console.log(`  ✓ Cloned successfully\n`);
        }
      } catch (error: any) {
        console.error(`  ✗ Error: ${error.message}\n`);
      }
    });
  })
  .catch(error => {
    console.error(`Failed to fetch repositories: ${error.message}`);
  });
}
