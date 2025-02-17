import fs from 'fs';
import path from 'path';
import {glob} from 'glob';
import consola from 'consola';

interface DeleteFileOptions {
  // 目标路径
  targetDir: string;
  // 文件名或后缀匹配规则
  pattern: string;
  // 是否递归删除子目录中的文件，默认为 false
  recursive?: boolean;
};
/**
 * 根据指定的匹配模式删除目标路径下的文件
 * @param {DeleteFileOptions} options - 删除文件的选项
 * @returns {Promise<string[]>} - 返回删除的文件列表
 */
export async function deleteFilesByPattern(options: DeleteFileOptions): Promise<string[]> {
  const { targetDir, pattern, recursive = false } = options;

  // 通过 glob 查找匹配的文件
  const globPattern = recursive ? path.join(targetDir, '**', pattern) : path.join(targetDir, pattern);
  const files = glob.sync(globPattern);
  console.log(globPattern)

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
