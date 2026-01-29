---
title: Linux Debugging Utilities Cheatsheet
---

# Linux Debugging Utilities Cheatsheet

## Process Debugging

### ps - Process Status

```bash
# Show all processes
ps aux

# Show processes in tree format
ps auxf

# Show processes for current user
ps ux

# Show specific process
ps -p <PID>

# Show process with custom format
ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%mem | head
```

### top / htop - Process Monitor

```bash
# Interactive process monitor
top

# Show processes sorted by CPU
top -o %CPU

# Show processes sorted by memory
top -o %MEM

# Update interval (seconds)
top -d 1

# htop (more user-friendly, install separately)
htop
```

### strace - System Call Tracer

```bash
# Trace system calls
strace <command>

# Trace specific system calls
strace -e trace=open,read,write <command>

# Trace child processes
strace -f <command>

# Show timestamps
strace -t <command>

# Show time spent in each call
strace -T <command>

# Save output to file
strace -o output.txt <command>

# Trace running process
strace -p <PID>
```

### ltrace - Library Call Tracer

```bash
# Trace library calls
ltrace <command>

# Trace specific library
ltrace -e malloc,free <command>

# Show timestamps
ltrace -t <command>

# Trace running process
ltrace -p <PID>
```

### lsof - List Open Files

```bash
# List all open files
lsof

# List files opened by process
lsof -p <PID>

# List files opened by user
lsof -u <username>

# List processes using a file
lsof <filepath>

# List network connections
lsof -i

# List TCP connections
lsof -iTCP

# List connections on specific port
lsof -i :8080

# List UDP connections
lsof -iUDP
```

## Network Debugging

### netstat - Network Statistics

```bash
# Show all connections
netstat -a

# Show TCP connections
netstat -at

# Show UDP connections
netstat -au

# Show listening ports
netstat -l

# Show with process info
netstat -tulpn

# Show routing table
netstat -r

# Show network interfaces
netstat -i
```

### ss - Socket Statistics (Modern netstat)

```bash
# Show all sockets
ss -a

# Show TCP sockets
ss -t

# Show UDP sockets
ss -u

# Show listening sockets
ss -l

# Show with process info
ss -tulpn

# Show connections to specific port
ss -tulpn 'sport = :8080'
```

### tcpdump - Packet Analyzer

```bash
# Capture all packets
sudo tcpdump

# Capture on specific interface
sudo tcpdump -i eth0

# Capture specific number of packets
sudo tcpdump -c 100

# Save to file
sudo tcpdump -w capture.pcap

# Read from file
tcpdump -r capture.pcap

# Filter by host
sudo tcpdump host 192.168.1.1

# Filter by port
sudo tcpdump port 80

# Filter by protocol
sudo tcpdump tcp

# Verbose output
sudo tcpdump -v
```

### wireshark / tshark - Network Protocol Analyzer

```bash
# Capture packets (tshark - CLI version)
sudo tshark -i eth0

# Capture specific number of packets
sudo tshark -c 100

# Save to file
sudo tshark -w capture.pcap

# Read from file
tshark -r capture.pcap

# Filter by protocol
tshark -f "tcp port 80"

# Display filter
tshark -Y "http.request"
```

### curl - HTTP Client

```bash
# Basic GET request
curl http://example.com

# Verbose output
curl -v http://example.com

# Follow redirects
curl -L http://example.com

# Include headers
curl -i http://example.com

# Show only headers
curl -I http://example.com

# POST request
curl -X POST -d "data=value" http://example.com

# POST JSON
curl -X POST -H "Content-Type: application/json" -d '{"key":"value"}' http://example.com

# Save output to file
curl -o output.html http://example.com

# Download file
curl -O http://example.com/file.txt

# Show progress
curl -# http://example.com/largefile.zip
```

## System Resource Debugging

### free - Memory Usage

```bash
# Show memory usage
free

# Human-readable format
free -h

# Show in MB
free -m

# Show in GB
free -g

# Continuous monitoring
free -h -s 1
```

### df - Disk Space

```bash
# Show disk usage
df

# Human-readable format
df -h

# Show inodes
df -i

# Show specific filesystem
df -h /dev/sda1
```

### du - Directory Usage

```bash
# Show directory size
du <directory>

# Human-readable format
du -h <directory>

# Show summary only
du -sh <directory>

# Show top 10 largest directories
du -h | sort -rh | head -10

# Exclude specific patterns
du -h --exclude="*.log" <directory>
```

### iostat - I/O Statistics

```bash
# Show I/O statistics
iostat

# Show with interval
iostat 1

# Show extended statistics
iostat -x

# Show specific device
iostat -x /dev/sda
```

### vmstat - Virtual Memory Statistics

```bash
# Show virtual memory stats
vmstat

# Show with interval
vmstat 1

# Show with count
vmstat 1 10
```

### sar - System Activity Reporter

```bash
# Show CPU usage
sar

# Show memory usage
sar -r

# Show I/O statistics
sar -b

# Show network statistics
sar -n DEV

# Show with interval
sar 1 10
```

## Performance Debugging

### perf - Performance Analysis

```bash
# Record performance data
sudo perf record <command>

# Show report
perf report

# List available events
perf list

# Show CPU usage
perf top

# Stat mode
perf stat <command>

# Trace system calls
perf trace <command>
```

### time - Command Timing

```bash
# Time a command
time <command>

# Detailed timing
/usr/bin/time -v <command>

# Show system and user time
time -p <command>
```

### valgrind - Memory Debugger

```bash
# Memory leak detection
valgrind --leak-check=full <command>

# Show memory errors
valgrind --tool=memcheck <command>

# Profile memory usage
valgrind --tool=massif <command>

# Show call graph
valgrind --tool=callgrind <command>
```

## Log Analysis

### journalctl - Systemd Journal

```bash
# Show all logs
journalctl

# Show logs for service
journalctl -u <service>

# Show recent logs
journalctl -n 100

# Follow logs
journalctl -f

# Show logs since time
journalctl --since "2024-01-01 00:00:00"

# Show logs between times
journalctl --since "2024-01-01" --until "2024-01-02"

# Show kernel logs
journalctl -k

# Show boot logs
journalctl -b
```

### dmesg - Kernel Messages

```bash
# Show kernel messages
dmesg

# Show recent messages
dmesg | tail

# Show with timestamps
dmesg -T

# Follow messages
dmesg -w

# Show errors only
dmesg | grep -i error
```

### tail / head - View Log Files

```bash
# Show last lines
tail <file>

# Show last N lines
tail -n 100 <file>

# Follow file (like tail -f)
tail -f <file>

# Show first lines
head <file>

# Show first N lines
head -n 100 <file>
```

### grep - Search Logs

```bash
# Search for pattern
grep "error" <file>

# Case insensitive
grep -i "error" <file>

# Show line numbers
grep -n "error" <file>

# Show context
grep -C 5 "error" <file>

# Recursive search
grep -r "error" <directory>

# Show only matching files
grep -l "error" <directory>/*

# Invert match
grep -v "error" <file>
```

## File System Debugging

### stat - File Statistics

```bash
# Show file info
stat <file>

# Show in terse format
stat -t <file>
```

### file - File Type

```bash
# Determine file type
file <file>

# Show MIME type
file -i <file>
```

### find - Find Files

```bash
# Find by name
find <directory> -name "*.log"

# Find by type
find <directory> -type f

# Find by size
find <directory> -size +100M

# Find by modification time
find <directory> -mtime -7

# Find and execute command
find <directory> -name "*.log" -exec rm {} \;

# Find with permissions
find <directory> -perm 644
```

### ls - List Files

```bash
# Long format
ls -l

# Show all files (including hidden)
ls -a

# Human-readable sizes
ls -lh

# Sort by size
ls -lhS

# Sort by time
ls -lht

# Show inode numbers
ls -i
```

## System Information

### uname - System Information

```bash
# Show system info
uname -a

# Show kernel name
uname -s

# Show kernel release
uname -r

# Show machine architecture
uname -m
```

### lscpu - CPU Information

```bash
# Show CPU information
lscpu

# Show in human-readable format
lscpu -e
```

### lsblk - Block Devices

```bash
# List block devices
lsblk

# Show filesystem info
lsblk -f

# Show tree format
lsblk -t
```

### ip / ifconfig - Network Configuration

```bash
# Show network interfaces (ip - modern)
ip addr show

# Show routes
ip route show

# Show link status
ip link show

# Show network interfaces (ifconfig - legacy)
ifconfig

# Show specific interface
ifconfig eth0
```

## Debugging Tips

### Check Running Processes

```bash
# Find process by name
ps aux | grep <process_name>

# Find process using port
lsof -i :8080
# or
netstat -tulpn | grep 8080
```

### Monitor System Resources

```bash
# Watch command output
watch -n 1 'free -h'

# Monitor multiple commands
watch -n 1 'ps aux | head -20'
```

### Debug Permission Issues

```bash
# Check file permissions
ls -l <file>

# Check directory permissions
ls -ld <directory>

# Check user/group
id

# Check sudo access
sudo -l
```

### Debug Service Issues

```bash
# Check service status
systemctl status <service>

# Check service logs
journalctl -u <service> -f

# Check service dependencies
systemctl list-dependencies <service>
```

## Quick Reference

| Tool | Purpose | Common Use Case |
| :--- | :--- | :--- |
| `strace` | System call tracing | Debug why process is slow |
| `lsof` | List open files | Find what's using a file/port |
| `tcpdump` | Packet capture | Debug network issues |
| `perf` | Performance profiling | Find CPU bottlenecks |
| `valgrind` | Memory debugging | Find memory leaks |
| `journalctl` | System logs | Debug service issues |
| `htop` | Process monitor | Monitor system resources |
| `ss` | Socket statistics | Debug network connections |

## Useful Links

*   [strace man page](https://man7.org/linux/man-pages/man1/strace.1.html)
*   [tcpdump documentation](https://www.tcpdump.org/manpages/tcpdump.1.html)
*   [perf tutorial](https://perf.wiki.kernel.org/index.php/Tutorial)
*   [valgrind documentation](https://valgrind.org/docs/manual/manual.html)



