export interface RepoInfo {
  author: string;
  repository: string;
  branch: string;
  rootName: string;
  resPath: string;
  urlPrefix: string;
  urlPostfix: string;
  downloadFileName: string;
  rootDirectoryName: string;
}

export interface DownloadProgress {
  isProcessing: boolean;
  downloadedFiles: number;
  totalFiles: number;
  currentFile?: string;
}

export class DownGitService {
  private parseInfo(url: string, fileName?: string, rootDirectory?: string): RepoInfo {
    const repoPath = new URL(url).pathname;
    const splitPath = repoPath.split("/");
    
    const info: RepoInfo = {
      author: splitPath[1],
      repository: splitPath[2],
      branch: splitPath[4] || "main",
      rootName: splitPath[splitPath.length - 1],
      resPath: "",
      urlPrefix: "",
      urlPostfix: "",
      downloadFileName: "",
      rootDirectoryName: ""
    };

    if (splitPath[4]) {
      info.resPath = repoPath.substring(
        repoPath.indexOf(splitPath[4]) + splitPath[4].length + 1
      );
    }

    info.urlPrefix = `https://api.github.com/repos/${info.author}/${info.repository}/contents/`;
    info.urlPostfix = `?ref=${info.branch}`;

    info.downloadFileName = fileName || info.rootName;

    if (rootDirectory === "false") {
      info.rootDirectoryName = "";
    } else if (!rootDirectory || rootDirectory === "" || rootDirectory === "true") {
      info.rootDirectoryName = info.rootName + "/";
    } else {
      info.rootDirectoryName = rootDirectory + "/";
    }

    return info;
  }

  async downloadZippedFiles(
    url: string,
    fileName?: string,
    rootDirectory?: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    const repoInfo = this.parseInfo(url, fileName, rootDirectory);
    
    if (!repoInfo.resPath || repoInfo.resPath === "") {
      // Download entire repository
      if (!repoInfo.branch || repoInfo.branch === "") {
        repoInfo.branch = "main";
      }
      
      const downloadUrl = `https://github.com/${repoInfo.author}/${repoInfo.repository}/archive/${repoInfo.branch}.zip`;
      window.location.href = downloadUrl;
      return;
    }

    try {
      const response = await fetch(repoInfo.urlPrefix + repoInfo.resPath + repoInfo.urlPostfix);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        await this.downloadDirectory(repoInfo, onProgress);
      } else {
        await this.downloadFile(data.download_url, repoInfo, onProgress);
      }
    } catch (error) {
      console.error("Error downloading:", error);
      // Try raw GitHub URL for large files
      await this.downloadFile(
        `https://raw.githubusercontent.com/${repoInfo.author}/${repoInfo.repository}/${repoInfo.branch}/${repoInfo.resPath}`,
        repoInfo,
        onProgress
      );
    }
  }

  private async downloadDirectory(
    repoInfo: RepoInfo,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    const dirPaths: string[] = [repoInfo.resPath];
    const files: Array<{ path: string; data: ArrayBuffer }> = [];
    
    await this.mapFileAndDirectory(dirPaths, files, repoInfo, onProgress);
    await this.downloadFiles(files, repoInfo, onProgress);
  }

  private async mapFileAndDirectory(
    dirPaths: string[],
    files: Array<{ path: string; data: ArrayBuffer }>,
    repoInfo: RepoInfo,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    if (dirPaths.length === 0) return;

    const currentPath = dirPaths.pop()!;
    const response = await fetch(repoInfo.urlPrefix + currentPath + repoInfo.urlPostfix);
    const data = await response.json();

    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].type === "dir") {
        dirPaths.push(data[i].path);
      } else if (data[i].download_url) {
        await this.getFile(data[i].path, data[i].download_url, files, repoInfo, onProgress);
      }
    }

    if (dirPaths.length > 0) {
      await this.mapFileAndDirectory(dirPaths, files, repoInfo, onProgress);
    }
  }

  private async getFile(
    path: string,
    url: string,
    files: Array<{ path: string; data: ArrayBuffer }>,
    repoInfo: RepoInfo,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    try {
      const response = await fetch(url);
      const data = await response.arrayBuffer();
      files.push({ path, data });
      
      if (onProgress) {
        onProgress({
          isProcessing: true,
          downloadedFiles: files.length,
          totalFiles: files.length,
          currentFile: path
        });
      }
    } catch (error) {
      console.error(`Error downloading file ${path}:`, error);
    }
  }

  private async downloadFiles(
    files: Array<{ path: string; data: ArrayBuffer }>,
    repoInfo: RepoInfo,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    if (onProgress) {
      onProgress({
        isProcessing: false,
        downloadedFiles: files.length,
        totalFiles: files.length
      });
    }

    // Create a simple ZIP-like structure using JSZip or similar
    // For now, we'll create individual file downloads
    files.forEach((file, index) => {
      const fileName = repoInfo.rootDirectoryName + 
        file.path.substring(decodeURI(repoInfo.resPath).length + 1);
      
      const blob = new Blob([file.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  private async downloadFile(
    url: string,
    repoInfo: RepoInfo,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    if (onProgress) {
      onProgress({
        isProcessing: true,
        downloadedFiles: 0,
        totalFiles: 1
      });
    }

    try {
      const response = await fetch(url);
      const data = await response.arrayBuffer();
      
      if (onProgress) {
        onProgress({
          isProcessing: false,
          downloadedFiles: 1,
          totalFiles: 1
        });
      }

      const blob = new Blob([data]);
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = repoInfo.downloadFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (onProgress) {
        onProgress({
          isProcessing: false,
          downloadedFiles: 0,
          totalFiles: 1
        });
      }
      throw error;
    }
  }
}
