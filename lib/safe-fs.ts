import { promises as fs, statSync } from 'fs';
import { resolve, join, sep, extname } from 'path';
import { logger } from './logger';

// Allowed file system roots (only these directories can be accessed)
const ALLOWED_FS_ROOTS = [
  resolve(process.cwd(), 'data'),
  resolve(process.cwd(), 'public'),
  resolve(process.cwd(), 'uploads')
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.yaml', '.yml', '.json', '.md', '.txt', '.png', '.jpg', '.jpeg', '.pdf'];

// Maximum file size (2 MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024;

export class FileSystemError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FileSystemError';
  }
}

export function safeJoin(root: string, ...segments: string[]): string {
  // Resolve the joined path
  const joined = resolve(root, join(...segments));
  
  // Ensure the resolved path is within the root directory
  if (!joined.startsWith(root + sep) && joined !== root) {
    throw new FileSystemError('Path traversal detected', 'PATH_TRAVERSAL_DETECTED');
  }
  
  return joined;
}

export function isAllowedExtension(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

export function isAllowedRoot(path: string): boolean {
  return ALLOWED_FS_ROOTS.some(root => path.startsWith(root + sep) || path === root);
}

export function validatePath(path: string): void {
  // Check for null bytes
  if (path.includes('\0')) {
    throw new FileSystemError('Null byte in path', 'INVALID_PATH');
  }
  
  // Check for dangerous patterns
  const dangerous = [
    /\.\./,                    // Directory traversal
    /^[\/\\]/,                 // Absolute paths
    /[<>:"|?*]/,              // Windows reserved characters
    /[\x00-\x1f\x80-\x9f]/   // Control characters
  ];
  
  for (const pattern of dangerous) {
    if (pattern.test(path)) {
      throw new FileSystemError('Dangerous path pattern detected', 'INVALID_PATH');
    }
  }
}

export async function readSafe(root: string, relativePath: string): Promise<string> {
  try {
    // Validate inputs
    if (!isAllowedRoot(root)) {
      throw new FileSystemError('Root directory not allowed', 'INVALID_ROOT');
    }
    
    validatePath(relativePath);
    
    // Construct safe path
    const absolutePath = safeJoin(root, relativePath);
    
    // Check file extension
    if (!isAllowedExtension(absolutePath)) {
      throw new FileSystemError('File extension not allowed', 'INVALID_EXTENSION');
    }
    
    // Check if file exists and is a file
    const stats = statSync(absolutePath);
    if (!stats.isFile()) {
      throw new FileSystemError('Path is not a file', 'NOT_A_FILE');
    }
    
    // Check file size
    if (stats.size > MAX_FILE_SIZE) {
      throw new FileSystemError('File too large', 'FILE_TOO_LARGE');
    }
    
    // Log the operation
    logger.debug('Safe file read', {
      root,
      relativePath,
      absolutePath,
      size: stats.size
    });
    
    // Read the file
    return await fs.readFile(absolutePath, 'utf8');
    
  } catch (error) {
    if (error instanceof FileSystemError) {
      throw error;
    }
    
    logger.warn('File read failed', {
      root,
      relativePath,
      error: error instanceof Error ? error.message : String(error)
    });
    
    throw new FileSystemError('File read failed', 'READ_FAILED');
  }
}

export async function writeSafe(
  root: string, 
  relativePath: string, 
  content: string
): Promise<void> {
  try {
    // Validate inputs
    if (!isAllowedRoot(root)) {
      throw new FileSystemError('Root directory not allowed', 'INVALID_ROOT');
    }
    
    validatePath(relativePath);
    
    // Check content size
    const contentSize = Buffer.byteLength(content, 'utf8');
    if (contentSize > MAX_FILE_SIZE) {
      throw new FileSystemError('Content too large', 'CONTENT_TOO_LARGE');
    }
    
    // Construct safe path
    const absolutePath = safeJoin(root, relativePath);
    
    // Check file extension
    if (!isAllowedExtension(absolutePath)) {
      throw new FileSystemError('File extension not allowed', 'INVALID_EXTENSION');
    }
    
    // Log the operation
    logger.debug('Safe file write', {
      root,
      relativePath,
      absolutePath,
      contentSize
    });
    
    // Write the file
    await fs.writeFile(absolutePath, content, 'utf8');
    
  } catch (error) {
    if (error instanceof FileSystemError) {
      throw error;
    }
    
    logger.warn('File write failed', {
      root,
      relativePath,
      error: error instanceof Error ? error.message : String(error)
    });
    
    throw new FileSystemError('File write failed', 'WRITE_FAILED');
  }
}

export async function listSafe(root: string, relativePath: string = ''): Promise<string[]> {
  try {
    // Validate inputs
    if (!isAllowedRoot(root)) {
      throw new FileSystemError('Root directory not allowed', 'INVALID_ROOT');
    }
    
    if (relativePath) {
      validatePath(relativePath);
    }
    
    // Construct safe path
    const absolutePath = relativePath ? safeJoin(root, relativePath) : root;
    
    // Check if directory exists
    const stats = statSync(absolutePath);
    if (!stats.isDirectory()) {
      throw new FileSystemError('Path is not a directory', 'NOT_A_DIRECTORY');
    }
    
    // Log the operation
    logger.debug('Safe directory list', {
      root,
      relativePath,
      absolutePath
    });
    
    // List directory contents
    const entries = await fs.readdir(absolutePath);
    
    // Filter by allowed extensions
    return entries.filter(entry => {
      const entryPath = join(absolutePath, entry);
      try {
        const entryStats = statSync(entryPath);
        return entryStats.isDirectory() || isAllowedExtension(entry);
      } catch {
        return false;
      }
    });
    
  } catch (error) {
    if (error instanceof FileSystemError) {
      throw error;
    }
    
    logger.warn('Directory list failed', {
      root,
      relativePath,
      error: error instanceof Error ? error.message : String(error)
    });
    
    throw new FileSystemError('Directory list failed', 'LIST_FAILED');
  }
}

// File upload validation
export function validateUploadedFile(file: { name: string; size: number; type?: string }): void {
  // Validate filename
  validatePath(file.name);
  
  if (!isAllowedExtension(file.name)) {
    throw new FileSystemError('File type not allowed', 'INVALID_FILE_TYPE');
  }
  
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new FileSystemError('File too large', 'FILE_TOO_LARGE');
  }
  
  // Validate MIME type if provided
  if (file.type) {
    const allowedMimeTypes = [
      'text/plain',
      'text/markdown',
      'application/json',
      'application/yaml',
      'text/yaml',
      'image/png',
      'image/jpeg',
      'application/pdf'
    ];
    
    if (!allowedMimeTypes.includes(file.type)) {
      throw new FileSystemError('MIME type not allowed', 'INVALID_MIME_TYPE');
    }
  }
}

// Magic number verification for file type validation
export function verifyFileType(content: Buffer, expectedExtension: string): boolean {
  const signatures: Record<string, Buffer[]> = {
    '.png': [Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
    '.jpg': [Buffer.from([0xFF, 0xD8, 0xFF])],
    '.jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
    '.pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])],
  };
  
  const expectedSignatures = signatures[expectedExtension.toLowerCase()];
  if (!expectedSignatures) {
    // For text files, we'll trust the extension
    return ['.txt', '.md', '.json', '.yaml', '.yml'].includes(expectedExtension.toLowerCase());
  }
  
  return expectedSignatures.some(signature => 
    content.subarray(0, signature.length).equals(signature)
  );
}