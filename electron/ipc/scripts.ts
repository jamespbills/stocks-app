import { ipcMain, BrowserWindow } from 'electron'
import { spawn, ChildProcess } from 'child_process'

const processes = new Map<number, ChildProcess>()

function broadcastOutput(pid: number, line: string, stream: 'stdout' | 'stderr'): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('scripts:output', pid, line, stream)
  })
}

function broadcastExit(pid: number, code: number | null): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('scripts:exit', pid, code ?? -1)
  })
}

export function registerScriptHandlers(): void {
  ipcMain.handle(
    'scripts:launch',
    (_, { scriptPath, args }: { scriptPath: string; args: string[] }): number => {
      const child = spawn('python', [scriptPath, ...args], { stdio: 'pipe' })
      const pid = child.pid!
      processes.set(pid, child)

      child.stdout?.on('data', (data: Buffer) => {
        data
          .toString()
          .split('\n')
          .filter((l) => l.length > 0)
          .forEach((line) => broadcastOutput(pid, line, 'stdout'))
      })

      child.stderr?.on('data', (data: Buffer) => {
        data
          .toString()
          .split('\n')
          .filter((l) => l.length > 0)
          .forEach((line) => broadcastOutput(pid, line, 'stderr'))
      })

      child.on('close', (code) => {
        processes.delete(pid)
        broadcastExit(pid, code)
      })

      return pid
    }
  )

  ipcMain.handle('scripts:stop', (_, pid: number): void => {
    const child = processes.get(pid)
    if (child) child.kill('SIGTERM')
  })
}
