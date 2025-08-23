# DownGit

A modern web application for downloading GitHub files and folders as ZIP archives. Built with Next.js, React, and Three.js for an immersive user experience.

## Features

- **GitHub Integration**: Download individual files or entire directories from GitHub repositories
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS and Radix UI components
- **3D Visuals**: Interactive 3D background using Three.js and React Three Fiber
- **Real-time Progress**: Track download progress with detailed file information
- **Shareable Links**: Generate shareable download links for easy sharing

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd DownGit
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Paste GitHub URL**: Enter a GitHub file or directory URL in the input field
2. **Click Download**: The application will process the URL and download the content
3. **Track Progress**: Monitor download progress in real-time
4. **Share Links**: Generate shareable download links for easy distribution

## Supported URL Formats

- **Repository**: `https://github.com/user/repo`
- **Branch**: `https://github.com/user/repo/tree/branch`
- **Directory**: `https://github.com/user/repo/tree/branch/path/to/directory`
- **File**: `https://github.com/user/repo/blob/branch/path/to/file`

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **3D Graphics**: Three.js, React Three Fiber
- **State Management**: React Hooks
- **Build Tool**: Next.js

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Original DownGit concept by Minhas Kamal
- Built with modern web technologies for enhanced user experience
