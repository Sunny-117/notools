import axios from "axios";
import fs from "fs";
import { exec } from "child_process";

export function autoPullRepository({
  username,
  giteeToken,
}: {
  username: string;
  giteeToken: string;
}): void {
  const cloneDirectory = `./cloned2/${username}`;

  if (!fs.existsSync(cloneDirectory)) {
    fs.mkdirSync(cloneDirectory, { recursive: true });
  }

  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://gitee.com/api/v5/users/${username}/repos?access_token=${giteeToken}&type=all&sort=created&page=1&per_page=100`,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
    },
  };

  axios(config)
    .then(function (response) {
      const data = response.data;
      fs.writeFileSync("./data.json", JSON.stringify(data), "utf-8");

      data.forEach((item: any) => {
        // 构建克隆命令，指定目标目录
        const cloneCommand = `git clone ${item.html_url} ${cloneDirectory}/${item.name}`;
        exec(cloneCommand, (error, stdout, stderr) => {
          if (error) {
            console.error(`克隆 ${item.name} 时出错: ${error.message}`);
            return;
          }
          if (stderr) {
            console.error(`克隆 ${item.name} 时出现警告: ${stderr}`);
            return;
          }
          console.log(
            `成功克隆 ${item.name} 到 ${cloneDirectory}/${item.name}`
          );
        });
      });
    })
    .catch(function (error) {
      console.log(error);
    });
}
