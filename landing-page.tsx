"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Grid } from "@react-three/drei"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { Manrope } from "next/font/google"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { DownGitService, DownloadProgress } from "@/lib/downgit-service"

const manrope = Manrope({ subsets: ["latin"] })
const downGitService = new DownGitService()

function SpinningLogo() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5
    }
  })

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.5, 0.5, 0.5]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>
      <mesh position={[-0.5, -0.5, -0.5]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#999999" />
      </mesh>
    </group>
  )
}

function AnimatedBox({ initialPosition }: { initialPosition: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [targetPosition, setTargetPosition] = useState(new THREE.Vector3(...initialPosition))
  const currentPosition = useRef(new THREE.Vector3(...initialPosition))

  const getAdjacentIntersection = (current: THREE.Vector3) => {
    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]
    const randomDirection = directions[Math.floor(Math.random() * directions.length)]
    return new THREE.Vector3(current.x + randomDirection[0] * 3, 0.5, current.z + randomDirection[1] * 3)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const newPosition = getAdjacentIntersection(currentPosition.current)
      newPosition.x = Math.max(-15, Math.min(15, newPosition.x))
      newPosition.z = Math.max(-15, Math.min(15, newPosition.z))
      setTargetPosition(newPosition)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useFrame((state, delta) => {
    if (meshRef.current) {
      currentPosition.current.lerp(targetPosition, 0.1)
      meshRef.current.position.copy(currentPosition.current)
    }
  })

  return (
    <mesh ref={meshRef} position={initialPosition}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ffffff" opacity={0.9} transparent />
      <lineSegments>
        <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(1, 1, 1)]} />
        <lineBasicMaterial attach="material" color="#000000" linewidth={2} />
      </lineSegments>
    </mesh>
  )
}

function Scene() {
  const initialPositions: [number, number, number][] = [
    [-9, 0.5, -9],
    [-3, 0.5, -3],
    [0, 0.5, 0],
    [3, 0.5, 3],
    [9, 0.5, 9],
    [-6, 0.5, 6],
    [6, 0.5, -6],
    [-12, 0.5, 0],
    [12, 0.5, 0],
    [0, 0.5, 12],
  ]

  return (
    <>
      <OrbitControls />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Grid
        renderOrder={-1}
        position={[0, 0, 0]}
        infiniteGrid
        cellSize={1}
        cellThickness={0.5}
        sectionSize={3}
        sectionThickness={1}
        sectionColor={new THREE.Color(0.5, 0.5, 0.5)}
        fadeDistance={50}
      />
      {initialPositions.map((position, index) => (
        <AnimatedBox key={index} initialPosition={position} />
      ))}
    </>
  )
}

export default function Component() {
  const [githubUrl, setGithubUrl] = useState("")
  const [isDownloading, setIsDownloading] = useState(false)
  const [progress, setProgress] = useState<DownloadProgress>({ 
    isProcessing: false, 
    downloadedFiles: 0, 
    totalFiles: 0 
  })
  const [shareableLink, setShareableLink] = useState("")
  const [showShareable, setShowShareable] = useState(false)
  const [error, setError] = useState("")
  const [inputError, setInputError] = useState("")
  const [currentView, setCurrentView] = useState<'main' | 'how-to-use'>('main')
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClear = () => {
    setGithubUrl("")
    setShowShareable(false)
    setShareableLink("")
    setError("")
    setInputError("")
    setProgress({ isProcessing: false, downloadedFiles: 0, totalFiles: 0 })
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setGithubUrl(url)
    
    // Clear previous errors
    setError("")
    
    // Validate input as user types (but only if they've typed something)
    if (url.trim()) {
      const validation = validateGitHubUrl(url)
      if (!validation.isValid) {
        setInputError(validation.error!)
      } else {
        setInputError("")
      }
    } else {
      setInputError("")
    }
  }

  const validateGitHubUrl = (url: string): { isValid: boolean; error?: string } => {
    if (!url.trim()) {
      return { isValid: false, error: "Please enter a GitHub URL" }
    }

    try {
      const urlObj = new URL(url)
      
      // Check if it's a GitHub URL
      if (urlObj.hostname !== 'github.com') {
        return { isValid: false, error: "Please enter a valid GitHub URL (github.com)" }
      }

      // Check if it has the right path structure
      const pathParts = urlObj.pathname.split('/').filter(Boolean)
      if (pathParts.length < 2) {
        return { isValid: false, error: "Invalid GitHub URL format. Please use a repository, file, or folder URL" }
      }

      // Check for common invalid patterns
      if (url.includes('/blob/') && pathParts.length < 5) {
        return { isValid: false, error: "Invalid file URL. Please make sure you're on the file's page" }
      }

      if (url.includes('/tree/') && pathParts.length < 4) {
        return { isValid: false, error: "Invalid folder URL. Please make sure you're on the folder's page" }
      }

      return { isValid: true }
    } catch {
      return { isValid: false, error: "Please enter a valid URL" }
    }
  }

  const handleDownload = async () => {
    // Validate URL first
    const validation = validateGitHubUrl(githubUrl)
    if (!validation.isValid) {
      setError(validation.error!)
      return
    }

    setIsDownloading(true)
    setError("")
    setProgress({ isProcessing: true, downloadedFiles: 0, totalFiles: 0 })

    // Add timeout for downloads
    const timeoutId = setTimeout(() => {
      if (isDownloading) {
        setError("Download is taking longer than expected. This might be due to a large repository or slow GitHub response. Please wait or try again later.")
      }
    }, 30000) // 30 seconds timeout

    try {
      await downGitService.downloadZippedFiles(
        githubUrl,
        undefined,
        undefined,
        (progress) => setProgress(progress)
      )
      
      clearTimeout(timeoutId)
      setShareableLink(`${window.location.origin}?url=${encodeURIComponent(githubUrl)}`)
      setShowShareable(true)
    } catch (err) {
      clearTimeout(timeoutId)
      let errorMessage = "An error occurred during download"
      
      if (err instanceof Error) {
        // Handle specific error types
        if (err.message.includes('HTTP error! status: 404')) {
          errorMessage = "Repository, file, or folder not found. Please check the URL and make sure it's accessible."
        } else if (err.message.includes('HTTP error! status: 403')) {
          errorMessage = "Access denied. This repository might be private or require authentication."
        } else if (err.message.includes('HTTP error! status: 500')) {
          errorMessage = "GitHub server error. Please try again in a few minutes."
        } else if (err.message.includes('fetch')) {
          errorMessage = "Network error. Please check your internet connection and try again."
        } else if (err.message.includes('timeout')) {
          errorMessage = "Request timed out. The file or folder might be too large or GitHub might be slow."
        } else if (err.message.includes('Failed to fetch')) {
          errorMessage = "Unable to connect to GitHub. Please check your internet connection and try again."
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
    } finally {
      clearTimeout(timeoutId)
      setIsDownloading(false)
      setProgress({ isProcessing: false, downloadedFiles: 0, totalFiles: 0 })
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink)
      // Show success indication
      const button = document.querySelector('[data-copy-button]') as HTMLButtonElement
      if (button) {
        const originalText = button.innerHTML
        button.innerHTML = '✅ Copied!'
        button.disabled = true
        button.className = 'bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30'
        
        // Reset button after 2 seconds
        setTimeout(() => {
          button.innerHTML = originalText
          button.disabled = false
          button.className = 'bg-white/20 border-white/30 text-white hover:bg-white/30'
        }, 2000)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const switchView = (view: 'main' | 'how-to-use') => {
    if (isAnimating || currentView === view) return
    
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentView(view)
      setIsAnimating(false)
    }, 300)
  }

  // Handle URL parameters for shareable links
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlParam = urlParams.get('url')
    
    if (urlParam && urlParam.trim()) {
      setGithubUrl(urlParam)
      // Auto-trigger download with the URL directly
      setTimeout(() => {
        handleDownloadWithUrl(urlParam)
      }, 500)
    }
  }, [])

  // Helper function to download with a specific URL
  const handleDownloadWithUrl = async (url: string) => {
    if (!url.trim()) return

    setIsDownloading(true)
    setError("")
    setProgress({ isProcessing: true, downloadedFiles: 0, totalFiles: 0 })

    try {
      await downGitService.downloadZippedFiles(
        url,
        undefined,
        undefined,
        (progress) => setProgress(progress)
      )
      
      setShareableLink(`${window.location.origin}?url=${encodeURIComponent(url)}`)
      setShowShareable(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during download")
    } finally {
      setIsDownloading(false)
      setProgress({ isProcessing: false, downloadedFiles: 0, totalFiles: 0 })
    }
  }



  const MainContent = () => (
    <div className={`transition-all duration-500 ease-in-out ${
      currentView === 'main' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="text-center mb-8">
        <h1 className="text-6xl font-bold mb-4">
          <a 
            href="https://github.com/elijah-farrell/DownGit" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition-colors duration-200 cursor-pointer"
          >
            DownGit
          </a>
        </h1>
        <h2 className="text-xl text-gray-300">Download GitHub Files & Folders</h2>
      </div>

      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-6">
          <div className="flex gap-2 mb-4">
            <Input
              value={githubUrl}
              onChange={handleUrlChange}
              placeholder="Paste any GitHub URL (file, folder, repo, or branch)"
              className={`flex-1 bg-white/20 border-white/30 text-white placeholder:text-gray-400 transition-all duration-200 ${
                inputError ? 'border-red-400/50 bg-red-500/10' : ''
              }`}
              disabled={isDownloading}
            />
            <Button
              onClick={handleClear}
              variant="outline"
              size="icon"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              disabled={isDownloading}
            >
              ✕
            </Button>
          </div>
          
          {inputError && (
            <div className="mt-2 p-3 bg-red-500/10 backdrop-blur-sm border border-red-400/30 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-red-400 text-sm">⚠️</span>
                <p className="text-red-200 text-sm">{inputError}</p>
              </div>
            </div>
          )}
          
          {!inputError && githubUrl.trim() && (
            <div className="mt-2 p-3 bg-blue-500/10 backdrop-blur-sm border border-blue-400/30 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-blue-400 text-sm">ℹ️</span>
                <p className="text-blue-200 text-sm">
                  <strong>Valid URL detected!</strong> This appears to be a valid GitHub URL format.
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={handleDownload}
            disabled={!githubUrl.trim() || isDownloading || !!inputError}
            className={`w-full font-semibold transition-all duration-200 ${
              !githubUrl.trim() || !!inputError
                ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                : 'bg-white text-black hover:bg-gray-200'
            }`}
          >
            {isDownloading ? "Downloading..." : "Download"}
          </Button>

          {isDownloading && (
            <div className="mt-4 text-center">
              <div className="text-sm text-gray-300">
                {progress.isProcessing ? (
                  <>
                    Processing... {progress.downloadedFiles} of {progress.totalFiles} files
                    {progress.currentFile && (
                      <div className="text-xs mt-1">Current: {progress.currentFile}</div>
                    )}
                  </>
                ) : (
                  "Downloading..."
                )}
              </div>
              {progress.totalFiles > 0 && (
                <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.downloadedFiles / progress.totalFiles) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-lg shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center">
                    <span className="text-red-400 text-sm">⚠️</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-red-300 font-medium mb-1">Download Error</h4>
                  <p className="text-red-200 text-sm leading-relaxed">{error}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setError("")}
                      className="text-red-300 hover:text-red-200 text-xs underline hover:no-underline transition-all duration-200"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => setGithubUrl("")}
                      className="text-red-300 hover:text-red-200 text-xs underline hover:no-underline transition-all duration-200"
                    >
                      Clear URL
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showShareable && (
            <div className="mt-6 p-4 bg-white/10 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Shareable Download Link</h3>
              <p className="text-sm text-gray-300 mb-3">Share this link with others or bookmark it for later use</p>
              <div className="flex gap-2">
                <Input
                  value={shareableLink}
                  readOnly
                  className="flex-1 bg-white/20 border-white/30 text-white text-sm"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  data-copy-button
                >
                  📋 Copy
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const HowToUseContent = () => (
    <div className={`transition-all duration-500 ease-in-out ${
      currentView === 'how-to-use' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="text-center mb-8">
        <h1 className="text-6xl font-bold mb-4">How to Use</h1>
        <h2 className="text-xl text-gray-300">Complete Guide to DownGit</h2>
      </div>

      <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-h-[50vh] overflow-hidden">
        <CardContent className="p-6 overflow-y-auto max-h-[calc(50vh-3rem)]">
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold mb-3 text-white">What is DownGit?</h3>
              <p className="text-gray-300 leading-relaxed">
                DownGit lets you download specific files or folders from GitHub repositories without cloning the entire project. 
                Perfect for getting just the components, examples, or documentation you need!
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-3 text-white">How to Download Files</h3>
              <ol className="list-decimal list-inside space-y-3 text-gray-300">
                <li className="leading-relaxed">
                  <strong>Go to GitHub:</strong> Find the file or folder you want on GitHub
                </li>
                <li className="leading-relaxed">
                  <strong>Copy the URL:</strong> Copy the address from your browser's address bar
                </li>
                <li className="leading-relaxed">
                  <strong>Paste & Download:</strong> Paste the URL above and click Download
                </li>
                <li className="leading-relaxed">
                  <strong>Get Your ZIP:</strong> Your files will download as a ZIP archive
                </li>
              </ol>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-3 text-white">Pro Tips</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li><strong>For folders:</strong> Navigate to the folder page (not individual files)</li>
                <li><strong>For single files:</strong> Make sure you're on the file's page</li>
                <li><strong>Large downloads:</strong> Be patient - processing takes time</li>
                <li><strong>Share downloads:</strong> Use the shareable link feature to bookmark</li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-3 text-white">Supported URL Formats</h3>
              <div className="space-y-4">
                <div className="bg-white/10 p-4 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">Repository</h4>
                  <p className="text-gray-300 text-sm font-mono break-all">
                    https://github.com/user/repo
                  </p>
                  <p className="text-gray-300 text-xs mt-1">Downloads the entire repository</p>
                </div>
                
                <div className="bg-white/10 p-4 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">Branch</h4>
                  <p className="text-gray-300 text-sm font-mono break-all">
                    https://github.com/user/repo/tree/branch
                  </p>
                  <p className="text-gray-300 text-xs mt-1">Downloads the entire branch</p>
                </div>
                
                <div className="bg-white/10 p-4 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">Directory</h4>
                  <p className="text-gray-300 text-sm font-mono break-all">
                    https://github.com/user/repo/tree/branch/path/to/directory
                  </p>
                  <p className="text-gray-300 text-xs mt-1">Downloads the specific directory</p>
                </div>
                
                <div className="bg-white/10 p-4 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">File</h4>
                  <p className="text-gray-300 text-sm font-mono break-all">
                    https://github.com/user/repo/blob/branch/path/to/file
                  </p>
                  <p className="text-gray-300 text-xs mt-1">Downloads the specific file</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-3 text-white">Limitations</h3>
              <div className="space-y-3 text-gray-300">
                <div className="bg-white/10 p-4 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">What DownGit Can't Handle</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Very large repositories</strong> (over 1GB or thousands of files)</li>
                    <li><strong>Private repositories</strong> (unless properly authenticated)</li>
                    <li><strong>Git LFS files</strong> (Large File Storage files)</li>
                    <li><strong>Extremely deep directories</strong> (very long file paths)</li>
                    <li><strong>Rate-limited requests</strong> (GitHub API limits)</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-400">
                  DownGit is designed for downloading specific files, folders, or smaller repositories. 
                  For very large projects, consider using <code className="bg-white/20 px-1 rounded">git clone</code> instead.
                </p>
              </div>
            </div>

            <div className="text-center pt-4">
              <Button
                onClick={() => switchView('main')}
                className="bg-white text-black hover:bg-gray-200 font-semibold px-8"
              >
                ← Back to DownGit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className={`relative w-full h-screen bg-black text-white overflow-hidden ${manrope.className}`}>
      <header className="absolute top-0 left-0 right-0 z-10 p-4 pt-6">
        <nav className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center">
            <a 
              href="https://github.com/elijah-farrell/DownGit" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center hover:opacity-80 transition-opacity duration-200"
            >
              <img 
                src="/downgit.png" 
                alt="DownGit Logo" 
                className="w-8 h-8 mr-3"
              />
              <span className="text-2xl font-bold">DownGit</span>
            </a>
          </div>
          <div className="flex space-x-6">
            <button
              onClick={() => switchView(currentView === 'main' ? 'how-to-use' : 'main')}
              className="hover:text-gray-300 transition-colors duration-200"
            >
              {currentView === 'main' ? 'How to Use' : 'Home'}
            </button>
          </div>
        </nav>
      </header>

      {currentView === 'main' ? (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/3 z-10 w-full max-w-2xl px-4">
          <MainContent />
        </div>
      ) : (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-full max-w-2xl px-4">
          <HowToUseContent />
        </div>
      )}

      <footer className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <p className="text-gray-400 text-sm">
          <a 
            href="https://github.com/elijah-farrell/DownGit" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-white transition-colors duration-200"
          >
            DownGit
          </a>
          {' '}by{' '}
          <a 
            href="https://github.com/elijah-farrell" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-white transition-colors duration-200"
          >
            Elijah Farrell
          </a>
        </p>
      </footer>

      <Canvas shadows camera={{ position: [30, 30, 30], fov: 50 }} className="absolute inset-0">
        <Scene />
      </Canvas>
    </div>
  )
}
