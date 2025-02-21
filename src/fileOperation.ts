import fs from "fs";
import path from "path";
import { glob } from "glob";
import consola from "consola";

interface DeleteFileOptions {
  // 目标路径
  targetDir: string;
  // 文件名或后缀匹配规则
  pattern: string;
  // 是否递归删除子目录中的文件，默认为 false
  recursive?: boolean;
}
/**
 * 根据指定的匹配模式删除目标路径下的文件
 * @param {DeleteFileOptions} options - 删除文件的选项
 * @returns {Promise<string[]>} - 返回删除的文件列表
 */
export async function deleteFilesByPattern(
  options: DeleteFileOptions
): Promise<string[]> {
  const { targetDir, pattern, recursive = false } = options;

  // 通过 glob 查找匹配的文件
  const globPattern = recursive
    ? path.join(targetDir, "**", pattern)
    : path.join(targetDir, pattern);
  const files = glob.sync(globPattern);
  console.log(globPattern);

  const deletedFiles: string[] = [];

  // 删除匹配到的文件
  for (const file of files) {
    try {
      fs.unlinkSync(file); // 删除文件
      deletedFiles.push(file);
    } catch (err) {
      console.error(`无法删除文件: ${file}`, err);
    }
  }
  consola.success(`成功删除了 ${deletedFiles.length} 个文件:`, deletedFiles);
  return deletedFiles;
}
/**
 * 删除指定目录下的所有空文件夹
 * @param {string} targetDir - 要删除空文件夹的目标目录
 * @param {boolean} recursive - 是否递归删除子目录中的空文件夹
 * @returns {Promise<string[]>} - 返回删除的空文件夹路径列表
 */
export async function deleteEmptyDirs(
  targetDir: string,
  recursive: boolean = false
): Promise<string[]> {
  const deletedDirs: string[] = [];

  // 遍历目标目录，查找空目录
  function walkDir(dir: string): void {
    const files = fs.readdirSync(dir);

    // 如果目录为空，删除它
    if (files.length === 0) {
      try {
        fs.rmdirSync(dir);
        deletedDirs.push(dir);
        consola.success(`删除空文件夹: ${dir}`);
      } catch (err) {
        console.error(`无法删除空文件夹: ${dir}`, err);
      }
    } else if (recursive) {
      // 递归处理子目录
      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.lstatSync(fullPath);

        if (stat.isDirectory()) {
          walkDir(fullPath); // 递归删除子目录
        }
      });

      // 再次检查当前目录是否为空，如果是，删除它
      const remainingFiles = fs.readdirSync(dir);
      if (remainingFiles.length === 0) {
        try {
          fs.rmdirSync(dir);
          deletedDirs.push(dir);
          consola.success(`删除空文件夹: ${dir}`);
        } catch (err) {
          console.error(`无法删除空文件夹: ${dir}`, err);
        }
      }
    }
  }

  walkDir(targetDir);

  consola.success(`成功删除了 ${deletedDirs.length} 个空文件夹:`, deletedDirs);
  return deletedDirs;
}
